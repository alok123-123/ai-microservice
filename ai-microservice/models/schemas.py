"""
Pydantic schemas for API request / response models.
"""

from pydantic import BaseModel, Field
from typing import Optional


class NewsArticle(BaseModel):
    """A single news article returned by the service."""

    title: str = Field(..., description="Headline of the article")
    description: Optional[str] = Field(None, description="Short summary / snippet")
    source: str = Field(..., description="Publisher name")
    url: str = Field(..., description="Link to the full article")
    published_at: Optional[str] = Field(None, description="ISO-8601 publish timestamp")
    image_url: Optional[str] = Field(None, description="Thumbnail image URL")
    sentiment_score: Optional[float] = Field(None, description="Compound sentiment score (-1 to 1)")
    sentiment_label: Optional[str] = Field(None, description="Sentiment label (Positive, Neutral, Negative)")


class NewsResponse(BaseModel):
    """Aggregated response returned to the caller."""

    ticker: str = Field(..., description="Stock ticker that was queried")
    company: Optional[str] = Field(None, description="Resolved company name")
    total_results: int = Field(..., description="Number of articles returned")
    source_used: str = Field(
        ..., description="Which data source fulfilled the request (newsapi | scraper)"
    )
    articles: list[NewsArticle] = Field(
        default_factory=list, description="List of news articles"
    )


class ErrorResponse(BaseModel):
    """Standard error envelope."""

    detail: str
