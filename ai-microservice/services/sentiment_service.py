"""
Sentiment analysis service supporting FinBERT with a robust VADER fallback.
"""
import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

# Initialize VADER globally as a reliable fallback
vader_analyzer = SentimentIntensityAnalyzer()

# Lazy-loaded FinBERT components
finbert_pipeline = None
finbert_failed = False

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
        
        # Build sequence classification pipeline
        finbert_pipeline = pipeline(
            "sentiment-analysis", 
            model=model, 
            tokenizer=tokenizer,
            device=-1 # Ensure running on CPU
        )
        logger.info("✅ FinBERT model loaded successfully.")
    except Exception as e:
        logger.warning(f"⚠️ Failed to load FinBERT: {e}. Defaulting to VADER fallback.")
        finbert_failed = True

def get_sentiment_score(text: str) -> dict:
    """
    Analyzes the sentiment of a given text.
    Uses FinBERT if available, otherwise falls back to VADER.
    """
    if not text:
        return {"score": 0.0, "label": "Neutral"}

    # Attempt to initialize FinBERT if not already loaded/failed
    if finbert_pipeline is None and not finbert_failed:
        init_finbert()

    if finbert_pipeline is not None:
        try:
            # FinBERT has a 512-token limit, truncate text roughly
            truncated_text = text[:1000]
            result = finbert_pipeline(truncated_text)[0]
            
            label_map = {
                "positive": "Positive",
                "negative": "Negative",
                "neutral": "Neutral"
            }
            raw_label = result['label'].lower()
            label = label_map.get(raw_label, "Neutral")
            confidence = result['score']
            
            # Convert confidence to score mapping:
            # Positive -> confidence
            # Negative -> -confidence
            # Neutral -> 0.0
            if label == "Positive":
                score = confidence
            elif label == "Negative":
                score = -confidence
            else:
                score = 0.0
                
            return {
                "score": float(score),
                "label": label
            }
        except Exception as e:
            logger.error(f"Error during FinBERT execution: {e}. Falling back to VADER.")

    # ── VADER Fallback ──────────────────────────────────────────────────
    try:
        sentiment_dict = vader_analyzer.polarity_scores(text)
        compound_score = sentiment_dict['compound']
        
        if compound_score >= 0.05:
            label = "Positive"
        elif compound_score <= -0.05:
            label = "Negative"
        else:
            label = "Neutral"
            
        return {
            "score": compound_score,
            "label": label
        }
    except Exception as e:
        logger.exception(f"Error during VADER sentiment analysis: {e}")
        return {"score": 0.0, "label": "Neutral"}
