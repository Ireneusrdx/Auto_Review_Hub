import os

import nltk
from flask import Flask, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer

app = Flask("Sentiment Analyzer")


def _load_analyzer():
    """Load VADER, falling back to the lexicon bundled in this repo.

    SentimentIntensityAnalyzer() raises LookupError when the vader_lexicon
    NLTK data is not installed. The original code crashed at import time in
    exactly that case, because the bundled vader_lexicon.zip was never used.
    """
    try:
        return SentimentIntensityAnalyzer()
    except LookupError:
        pass
    # Try the standard NLTK download first (works with network access).
    try:
        nltk.download('vader_lexicon', quiet=True)
        return SentimentIntensityAnalyzer()
    except Exception:
        pass
    # Offline fallback: place the bundled lexicon zip where NLTK looks
    # for it (sentiment/vader_lexicon.zip inside an nltk_data directory).
    # NLTK reads the lexicon straight out of the zip; extracting it does
    # not match the resource path the VADER loader requests.
    import shutil
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(base_dir, 'sentiment', 'vader_lexicon.zip')
    data_dir = os.path.join(base_dir, 'nltk_data')
    sentiment_dir = os.path.join(data_dir, 'sentiment')
    os.makedirs(sentiment_dir, exist_ok=True)
    shutil.copyfile(zip_path, os.path.join(sentiment_dir, 'vader_lexicon.zip'))
    # Newer NLTK refuses to load data from group/other-writable folders
    # (shared checkouts, some container filesystems): tighten permissions.
    for root, dirs, files in os.walk(data_dir):
        os.chmod(root, 0o755)
        for name in files:
            os.chmod(os.path.join(root, name), 0o644)
    if data_dir not in nltk.data.path:
        nltk.data.path.append(data_dir)
    return SentimentIntensityAnalyzer()


sia = _load_analyzer()


@app.get('/')
def home():
    return "Welcome to the Sentiment Analyzer. \
    Use /analyze/text to get the sentiment"


@app.get('/analyze/<path:input_txt>')
def analyze_sentiment(input_txt):
    scores = sia.polarity_scores(input_txt)
    pos = float(scores['pos'])
    neg = float(scores['neg'])
    neu = float(scores['neu'])
    res = "positive"
    if (neg > pos and neg > neu):
        res = "negative"
    elif (neu > neg and neu > pos):
        res = "neutral"
    return jsonify({"sentiment": res})


if __name__ == "__main__":
    # restapis.py expects the analyzer on port 5050 when run directly.
    # In Docker / Code Engine the platform sets PORT (Flask's own default
    # of 5000 is used there via `flask run`).
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5050")))
