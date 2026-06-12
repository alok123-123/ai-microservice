"""
Sentiment analysis service using VADER.
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import logging

logger = logging.getLogger(__name__)

# Initialize the analyzer globally so it's loaded once
analyzer = SentimentIntensityAnalyzer()

def get_sentiment_score(text: str) -> dict:
    """
    Analyzes the sentiment of a given text using VADER.
    Returns a dictionary with 'score' (compound score between -1 and 1)
    and 'label' (Positive, Neutral, Negative).
    """
    if not text:
        return {"score": 0.0, "label": "Neutral"}

    try:
        sentiment_dict = analyzer.polarity_scores(text)
        compound_score = sentiment_dict['compound']
        
        # Determine label based on typical VADER thresholds
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
        logger.exception(f"Error during sentiment analysis: {e}")
        return {"score": 0.0, "label": "Neutral"}
