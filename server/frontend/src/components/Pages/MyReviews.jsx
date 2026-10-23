import React, { useState, useEffect } from 'react';
import "../Dealers/Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import positive_icon from "../assets/positive.png"
import neutral_icon from "../assets/neutral.png"
import negative_icon from "../assets/negative.png"

const origin = window.location.origin;

const senti_icon = (sentiment) =>
  sentiment === "positive" ? positive_icon
    : sentiment === "negative" ? negative_icon : neutral_icon;

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [dealerNames, setDealerNames] = useState({});
  const [state, setState] = useState('loading');

  useEffect(() => {
    const load = async () => {
      if (!sessionStorage.getItem('username')) {
        setState('login');
        return;
      }
      try {
        const [mineRes, dealersRes] = await Promise.all([
          fetch(`${origin}/djangoapp/my_reviews`),
          fetch(`${origin}/djangoapp/get_dealers`),
        ]);
        const mine = await mineRes.json();
        const dealersJson = await dealersRes.json();
        if (mine.status === 401) {
          setState('login');
          return;
        }
        const names = {};
        (dealersJson.dealers || []).forEach((d) => {
          names[d.id] = d.full_name;
        });
        setDealerNames(names);
        setReviews(mine.reviews || []);
        setState('ready');
      } catch (e) {
        setState('error');
      }
    };
    load();
  }, []);

  return (
    <div>
      <Header />
      <div className="simple_page">
        <h2 style={{ color: '#123c5e' }}>My Reviews</h2>
        {state === 'loading' && (
          <p className="dealers_hint">Loading your reviews…</p>
        )}
        {state === 'login' && (
          <p className="dealers_hint">
            You need to be logged in to see your reviews.{' '}
            <a href="/login">Log in</a> or <a href="/register">register</a>.
          </p>
        )}
        {state === 'error' && (
          <p className="dealers_hint">
            Could not load your reviews. The free servers may still be
            waking up — refresh in a few seconds.
          </p>
        )}
        {state === 'ready' && reviews.length === 0 && (
          <p className="dealers_hint">
            You have not posted a review yet. Open any dealer and choose
            "Write a review".
          </p>
        )}
        {state === 'ready' && reviews.map((review) => (
          <div key={review.id} className="model_row"
            style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <img src={senti_icon(review.sentiment)}
                className="emotion_icon" style={{ position: 'static' }}
                alt={review.sentiment} />
              <div>
                <a href={`/dealer/${review.dealership}`}>
                  {dealerNames[review.dealership]
                    || `Dealer ${review.dealership}`}
                </a>
                <div style={{ marginTop: '4px' }}>{review.review}</div>
                <div style={{ color: '#51606e', fontSize: '13px',
                  marginTop: '4px' }}>
                  {review.car_make} {review.car_model} {review.car_year} ·
                  Purchased {review.purchase_date}
                </div>
              </div>
            </div>
            <span className="review_car_chip">{review.sentiment}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReviews;
