# Uncomment the required imports before adding the code

# from django.shortcuts import render
# from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.models import User
# from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import logout
# from django.contrib import messages
# from datetime import datetime
from .models import CarMake, CarModel

from django.http import JsonResponse
from django.contrib.auth import login, authenticate
import logging
import json
import time
from collections import Counter
from django.views.decorators.csrf import csrf_exempt
from .populate import initiate
from .restapis import (get_request, analyze_review_sentiments, post_review,
                       get_all_reviews, analyze_many, post_request)

# Get an instance of a logger
logger = logging.getLogger(__name__)


# Create your views here.


def get_cars(request):
    count = CarMake.objects.filter().count()
    print(count)
    if count == 0:
        initiate()
    car_models = CarModel.objects.select_related('car_make')
    cars = []
    for car_model in car_models:
        cars.append({"CarModel": car_model.name,
                     "CarMake": car_model.car_make.name})
    return JsonResponse({"CarModels": cars})


# Create a `login_request` view to handle sign in request
@csrf_exempt
def login_user(request):
    # Get username and password from request.POST dictionary
    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    # Try to check if provide credential can be authenticated
    user = authenticate(username=username, password=password)
    data = {"userName": username}
    if user is not None:
        # If user is valid, call login method to login current user
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
    return JsonResponse(data)


# Create a `logout_request` view to handle sign out request
def logout_request(request):
    logout(request)
    data = {"userName": ""}
    return JsonResponse(data)


# Create a `registration` view to handle sign up request
@csrf_exempt
def registration(request):
    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    first_name = data['firstName']
    last_name = data['lastName']
    email = data['email']
    username_exist = False
    try:
        # Check if user already exists
        User.objects.get(username=username)
        username_exist = True
    except Exception as e:
        # If not, simply log this is a new user
        logger.debug("{} is new user".format(username), e)
    # If it is a new user
    if not username_exist:
        # Create user in auth_user table
        user = User.objects.create_user(username=username,
                                        first_name=first_name,
                                        last_name=last_name,
                                        password=password, email=email)
        # Login the user and redirect to list page
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
        return JsonResponse(data)
    else:
        data = {"userName": username, "error": "Already Registered"}
        return JsonResponse(data)

# Update the `get_dealerships` view to render the index page with
# a list of dealerships
# def get_dealerships(request):
# Update the `get_dealerships` render list of
# dealerships all by default, particular state if state is passed


def get_dealerships(request, state="All"):
    if state == "All":
        endpoint = "/fetchDealers"
    else:
        endpoint = "/fetchDealers/"+state
    dealerships = get_request(endpoint)
    print(dealerships)
    return JsonResponse({"status": 200, "dealers": dealerships or []})


# Create a `get_dealer_reviews` view to render the reviews of a dealer
def get_dealer_reviews(request, dealer_id):
    # if dealer id has been provided
    if dealer_id:
        endpoint = "/fetchReviews/dealer/"+str(dealer_id)
        reviews = get_request(endpoint) or []
        for review_detail in reviews:
            response = analyze_review_sentiments(review_detail['review'])
            if response and 'sentiment' in response:
                review_detail['sentiment'] = response['sentiment']
            else:
                # Sentiment service unavailable must never break reviews
                review_detail['sentiment'] = "neutral"
        return JsonResponse({"status": 200, "reviews": reviews})
    else:
        return JsonResponse({"status": 400, "message": "Bad Request"})

# Create a `get_dealer_details` view to render the dealer details


def get_dealer_details(request, dealer_id):
    if dealer_id:
        endpoint = "/fetchDealer/"+str(dealer_id)
        dealership = get_request(endpoint)
        return JsonResponse({"status": 200, "dealer": dealership or []})
    else:
        return JsonResponse({"status": 400, "message": "Bad Request"})

# Create a `add_review` view to submit a review


_stats_cache = {"at": 0.0, "data": None}
_STATS_TTL_SECONDS = 300


def _compute_stats():
    """Aggregate every review into per-dealer and per-car-model stats.

    Sentiment is not stored in MongoDB (it is computed by the analyzer
    service), so a full pass costs one analyzer call per review; results
    are cached for a few minutes because the dealers list renders them
    for all 50 dealers at once.
    """
    reviews = get_all_reviews()
    sentiments = analyze_many([r.get('review', '') for r in reviews])

    dealers = {}
    models = {}
    for review, sentiment in zip(reviews, sentiments):
        entry = dealers.setdefault(review.get('dealership'), {
            "reviews": 0, "positive": 0, "neutral": 0, "negative": 0,
            "makes": Counter(),
        })
        entry["reviews"] += 1
        if sentiment in ("positive", "neutral", "negative"):
            entry[sentiment] += 1
        if review.get('car_make'):
            entry["makes"][review['car_make']] += 1

        key = (review.get('car_make', ''), review.get('car_model', ''))
        model = models.setdefault(key, {
            "make": key[0], "model": key[1], "reviews": 0, "positive": 0,
        })
        model["reviews"] += 1
        if sentiment == "positive":
            model["positive"] += 1

    dealer_out = {}
    for dealer_id, entry in dealers.items():
        total = entry["reviews"]
        dealer_out[str(dealer_id)] = {
            "reviews": total,
            "positive": entry["positive"],
            "neutral": entry["neutral"],
            "negative": entry["negative"],
            # Reputation score: share of positive reviews, 0-100.
            "score": round(100 * entry["positive"] / total) if total else None,
            "top_makes": [name for name, _ in entry["makes"].most_common(3)],
        }

    model_out = []
    for model in models.values():
        total = model["reviews"]
        model["positive_pct"] = (
            round(100 * model["positive"] / total) if total else 0)
        model_out.append(model)
    model_out.sort(key=lambda m: (-m["reviews"], m["make"], m["model"]))

    return {"dealers": dealer_out, "models": model_out,
            "total_reviews": len(reviews)}


def dealer_stats(request):
    """Per-dealer review counts, sentiment split, reputation score."""
    now = time.time()
    if (_stats_cache["data"] is None
            or now - _stats_cache["at"] > _STATS_TTL_SECONDS):
        _stats_cache["data"] = _compute_stats()
        _stats_cache["at"] = now
    return JsonResponse({"status": 200, **_stats_cache["data"]})


def my_reviews(request):
    """Reviews posted by the logged-in user (matched by reviewer name).

    Reviews store the poster's first + last name (the post-review flow
    builds it from the account), so a user's reviews are the ones whose
    name matches their account name.
    """
    if request.user.is_anonymous:
        return JsonResponse({"status": 401, "message": "Login required"})
    full_name = "{} {}".format(request.user.first_name,
                               request.user.last_name).strip()
    # The post-review flow stores the first + last name, but falls back
    # to the bare username when those are missing from the session, so a
    # user's reviews can carry either form.
    names = {full_name, request.user.username}
    mine = [r for r in get_all_reviews() if r.get('name') in names]
    sentiments = analyze_many([r.get('review', '') for r in mine])
    for review, sentiment in zip(mine, sentiments):
        review['sentiment'] = sentiment
    return JsonResponse({"status": 200, "reviews": mine})


@csrf_exempt
def mark_helpful(request, review_id):
    """Proxy a 'helpful' vote to the review service."""
    if request.method != "POST":
        return JsonResponse({"status": 405, "message": "POST required"})
    result = post_request(f"/mark_helpful/{review_id}")
    if result is None:
        return JsonResponse({"status": 502,
                             "message": "Review service unavailable"})
    return JsonResponse({"status": 200, **result})


@csrf_exempt
def add_review(request):
    if request.user.is_anonymous is False:
        try:
            data = json.loads(request.body)
            response = post_review(data)
            if response is None:
                return JsonResponse({"status": 502,
                                     "message": "Review service unavailable"})
            return JsonResponse({"status": 200})
        except Exception as err:
            logger.error("Error in posting review: %s", err)
            return JsonResponse({"status": 401,
                                 "message": "Error in posting review"})
    else:
        return JsonResponse({"status": 403, "message": "Unauthorized"})
