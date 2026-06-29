"""
Sentiment analysis service supporting FinBERT with a robust VADER fallback.

Phase 5 improvements:
  - Batch inference: process multiple texts in a single forward pass
  - TTL caching: avoid re-analyzing identical headlines
  - Async-safe: FinBERT runs in a thread-pool to avoid blocking the event loop
"""
import asyncio
import hashlib
import logging
import time
from functools import lru_cache

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from config import SENTIMENT_CACHE_TTL_SECONDS, SENTIMENT_THRESHOLD

logger = logging.getLogger(__name__)

# Initialize VADER globally as a reliable fallback
vader_analyzer = SentimentIntensityAnalyzer()

# Lazy-loaded FinBERT components
finbert_pipeline = None
finbert_failed = False

# ── TTL Cache ────────────────────────────────────────────────────────────────
# Simple dict-based cache with TTL.  Key = SHA-256 of text, value = (result, timestamp)
_sentiment_cache: dict[str, tuple[dict, float]] = {}
_CACHE_MAX_SIZE = 2000


def _cache_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _cache_get(text: str) -> dict | None:
    key = _cache_key(text)
    entry = _sentiment_cache.get(key)
    if entry is None:
        return None
    result, ts = entry
    if time.time() - ts > SENTIMENT_CACHE_TTL_SECONDS:
        del _sentiment_cache[key]
        return None
    return result


def _cache_set(text: str, result: dict) -> None:
    # Evict oldest entries if cache is full
    if len(_sentiment_cache) >= _CACHE_MAX_SIZE:
        oldest_key = min(_sentiment_cache, key=lambda k: _sentiment_cache[k][1])
        del _sentiment_cache[oldest_key]
    _sentiment_cache[_cache_key(text)] = (result, time.time())


# ── FinBERT ──────────────────────────────────────────────────────────────────

def init_finbert():
    """
    Attempts to import transformers and download/initialize the ProsusAI/finbert pipeline.
    If it fails, sets a flag to bypass further initialization and default to VADER.
    """
    global finbert_pipeline, finbert_failed
    if finbert_pipeline is not None or finbert_failed:
        return

    try:
        logger.info("🚀 Loading FinBERT model (this downloads the ~400MB model on the first load)...")
        from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

        tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
        model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")

        # Build sequence classification pipeline with proper truncation
        finbert_pipeline = pipeline(
            "sentiment-analysis",
            model=model,
            tokenizer=tokenizer,
            device=-1,           # Ensure running on CPU
            truncation=True,     # Phase 9: proper tokenizer truncation instead of char slicing
            max_length=512,
        )
        logger.info("✅ FinBERT model loaded successfully.")
    except Exception as e:
        logger.warning(f"⚠️ Failed to load FinBERT: {e}. Defaulting to VADER fallback.")
        finbert_failed = True


# ── Core analysis functions ──────────────────────────────────────────────────

LABEL_MAP = {
    "positive": "Positive",
    "negative": "Negative",
    "neutral": "Neutral",
}


def _finbert_analyze_single(text: str) -> dict:
    """Run FinBERT on a single text (synchronous)."""
    result = finbert_pipeline(text)[0]
    raw_label = result["label"].lower()
    label = LABEL_MAP.get(raw_label, "Neutral")
    confidence = result["score"]

    if label == "Positive":
        score = confidence
    elif label == "Negative":
        score = -confidence
    else:
        score = 0.0

    return {"score": float(score), "label": label, "confidence": float(confidence)}


def _finbert_analyze_batch(texts: list[str]) -> list[dict]:
    """
    Run FinBERT on a batch of texts in a single forward pass.
    Much faster than sequential per-text inference.
    """
    results = finbert_pipeline(texts)
    output = []
    for result in results:
        raw_label = result["label"].lower()
        label = LABEL_MAP.get(raw_label, "Neutral")
        confidence = result["score"]

        if label == "Positive":
            score = confidence
        elif label == "Negative":
            score = -confidence
        else:
            score = 0.0

        output.append({"score": float(score), "label": label, "confidence": float(confidence)})
    return output


def _vader_analyze(text: str) -> dict:
    """VADER fallback analysis."""
    try:
        sentiment_dict = vader_analyzer.polarity_scores(text)
        compound_score = sentiment_dict["compound"]

        if compound_score >= SENTIMENT_THRESHOLD:
            label = "Positive"
        elif compound_score <= -SENTIMENT_THRESHOLD:
            label = "Negative"
        else:
            label = "Neutral"

        return {"score": compound_score, "label": label, "confidence": abs(compound_score)}
    except Exception as e:
        logger.exception(f"Error during VADER sentiment analysis: {e}")
        return {"score": 0.0, "label": "Neutral", "confidence": 0.0}


# ── Public API ───────────────────────────────────────────────────────────────

def get_sentiment_score(text: str) -> dict:
    """
    Analyzes the sentiment of a given text (synchronous).
    Uses FinBERT if available, otherwise falls back to VADER.
    Results are cached by text hash.
    """
    if not text:
        return {"score": 0.0, "label": "Neutral", "confidence": 0.0}

    # Check cache first
    cached = _cache_get(text)
    if cached is not None:
        return cached

    # Attempt to initialize FinBERT if not already loaded/failed
    if finbert_pipeline is None and not finbert_failed:
        init_finbert()

    result = None
    if finbert_pipeline is not None:
        try:
            result = _finbert_analyze_single(text)
        except Exception as e:
            logger.error(f"Error during FinBERT execution: {e}. Falling back to VADER.")

    if result is None:
        result = _vader_analyze(text)

    _cache_set(text, result)
    return result


def get_sentiment_scores_batch(texts: list[str]) -> list[dict]:
    """
    Batch sentiment analysis.  Checks cache per-text, then runs FinBERT
    batch inference only on uncached texts.  Much more efficient than
    calling get_sentiment_score() in a loop.
    """
    if not texts:
        return []

    results = [None] * len(texts)
    uncached_indices = []
    uncached_texts = []

    # Step 1: resolve from cache
    for i, text in enumerate(texts):
        if not text:
            results[i] = {"score": 0.0, "label": "Neutral", "confidence": 0.0}
            continue
        cached = _cache_get(text)
        if cached is not None:
            results[i] = cached
        else:
            uncached_indices.append(i)
            uncached_texts.append(text)

    if not uncached_texts:
        return results

    # Step 2: batch inference on uncached texts
    if finbert_pipeline is None and not finbert_failed:
        init_finbert()

    batch_results = None
    if finbert_pipeline is not None:
        try:
            batch_results = _finbert_analyze_batch(uncached_texts)
        except Exception as e:
            logger.error(f"Error during FinBERT batch execution: {e}. Falling back to VADER.")

    # Fallback: VADER one-by-one if FinBERT failed
    if batch_results is None:
        batch_results = [_vader_analyze(t) for t in uncached_texts]

    # Step 3: merge and cache
    for idx, batch_idx in enumerate(uncached_indices):
        result = batch_results[idx]
        results[batch_idx] = result
        _cache_set(uncached_texts[idx], result)

    return results


async def get_sentiment_scores_batch_async(texts: list[str]) -> list[dict]:
    """
    Async wrapper around batch sentiment.
    Runs the synchronous FinBERT/VADER inference in a thread-pool executor
    so it does not block the FastAPI event loop.
    """
    return await asyncio.to_thread(get_sentiment_scores_batch, texts)
