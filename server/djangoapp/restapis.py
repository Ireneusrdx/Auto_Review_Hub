# Uncomment the imports below before you add the function code
import requests
import os
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()

backend_url = os.getenv(
    'backend_url', default="http://localhost:3030")
sentiment_analyzer_url = os.getenv(
    'sentiment_analyzer_url',
    default="http://localhost:5050/")


def get_request(endpoint, **kwargs):
    params = ""
    if kwargs:
        for key, value in kwargs.items():
            params = params+key+"="+value+"&"

    request_url = backend_url+endpoint+"?"+params

    print("GET from {} ".format(request_url))
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url, timeout=10)
        # print(response.json())
        return response.json()
    except Exception as e:
        print("Network exception occurred", e)
        return None

# def analyze_review_sentiments(text):
# request_url = sentiment_analyzer_url+"analyze/"+text
# Add code for retrieving sentiments


def analyze_review_sentiments(text):
    # Review text contains spaces and punctuation: it must be URL-encoded,
    # otherwise most real reviews produce an invalid request URL.
    request_url = sentiment_analyzer_url+"analyze/"+quote(str(text), safe="")
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url, timeout=10)
        return response.json()
    except Exception as err:
        print(f"Unexpected {err=}, {type(err)=}")
        print("Network exception occurred")
        return {"sentiment": "neutral"}


def post_review(data_dict):
    request_url = backend_url+"/insert_review"
    try:
        response = requests.post(request_url, json=data_dict, timeout=10)
        print(response.json())
        return response.json()
    except Exception as e:
        print("Network exception occurred", e)
        return None


def get_all_reviews():
    """Every review in the review service (used by the stats views)."""
    return get_request("/fetchReviews") or []


def analyze_many(texts):
    """Sentiment for a list of review texts, analyzed in parallel.

    The analyzer is a fast local-network service, but one HTTP call per
    review in sequence makes aggregate pages slow; a small thread pool
    keeps stats endpoints responsive. Order is preserved.
    """
    from concurrent.futures import ThreadPoolExecutor

    def one(text):
        response = analyze_review_sentiments(text)
        if response and 'sentiment' in response:
            return response['sentiment']
        return "neutral"

    if not texts:
        return []
    with ThreadPoolExecutor(max_workers=10) as pool:
        return list(pool.map(one, texts))


def post_request(endpoint, payload=None):
    """POST to the review service (e.g. the helpful-vote endpoint)."""
    request_url = backend_url+endpoint
    try:
        response = requests.post(request_url, json=payload or {}, timeout=10)
        return response.json()
    except Exception as e:
        print("Network exception occurred", e)
        return None
