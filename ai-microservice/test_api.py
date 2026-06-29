"""Quick test script for the news API."""
import httpx
import json

# Test TSLA
r = httpx.get("http://127.0.0.1:8000/api/news/TSLA", params={"page_size": 3}, timeout=20.0)
data = r.json()
print(f"Ticker: {data['ticker']} | Company: {data['company']}")
print(f"Source: {data['source_used']} | Results: {data['total_results']}")
for a in data["articles"]:
    print(f"  - [{a['source']}] {a['title'][:90]}")
    print(f"    Sentiment: {a.get('sentiment_label')} ({a.get('sentiment_score')})")

print()

# Test GOOGL
r2 = httpx.get("http://127.0.0.1:8000/api/news/GOOGL", params={"page_size": 3}, timeout=20.0)
data2 = r2.json()
print(f"Ticker: {data2['ticker']} | Company: {data2['company']}")
print(f"Source: {data2['source_used']} | Results: {data2['total_results']}")
for a in data2["articles"]:
    print(f"  - [{a['source']}] {a['title'][:90]}")
    print(f"    Sentiment: {a.get('sentiment_label')} ({a.get('sentiment_score')})")
