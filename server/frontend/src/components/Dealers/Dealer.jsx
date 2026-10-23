import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import positive_icon from "../assets/positive.png"
import neutral_icon from "../assets/neutral.png"
import negative_icon from "../assets/negative.png"
import Header from '../Header/Header';

const origin = window.location.origin;

const parseDate = (value) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const Dealer = () => {
  const [dealer, setDealer] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [voted, setVoted] = useState(() =>
    JSON.parse(localStorage.getItem('helpful_votes') || '[]'));

  const params = useParams();
  const id = params.id;
  const isLoggedIn = sessionStorage.getItem("username") != null;

  useEffect(() => {
    const load = async () => {
      try {
        const [dealerRes, reviewsRes] = await Promise.all([
          fetch(`${origin}/djangoapp/dealer/${id}`),
          fetch(`${origin}/djangoapp/reviews/dealer/${id}`),
        ]);
        const dealerJson = await dealerRes.json();
        const reviewsJson = await reviewsRes.json();
        if (dealerJson.status === 200 && dealerJson.dealer.length) {
          setDealer(dealerJson.dealer[0]);
        }
        if (reviewsJson.status === 200) {
          setReviews(reviewsJson.reviews || []);
        }
      } catch (e) {
        // Leave empty states to render; the page copy explains wake-up.
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [id]);

  const summary = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    const makes = new Map();
    reviews.forEach((r) => {
      if (counts[r.sentiment] !== undefined) counts[r.sentiment] += 1;
      const label = `${r.car_make} ${r.car_model}`;
      makes.set(label, (makes.get(label) || 0) + 1);
    });
    const total = reviews.length;
    const topCars = Array.from(makes.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label]) => label);
    return {
      counts,
      total,
      score: total ? Math.round((100 * counts.positive) / total) : null,
      topCars,
    };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'newest') {
      list.sort((a, b) => parseDate(b.purchase_date) - parseDate(a.purchase_date));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => parseDate(a.purchase_date) - parseDate(b.purchase_date));
    } else if (sortBy === 'helpful') {
      list.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
    }
    return list;
  }, [reviews, sortBy]);

  const senti_icon = (sentiment) =>
    sentiment === "positive" ? positive_icon
      : sentiment === "negative" ? negative_icon : neutral_icon;

  const markHelpful = async (review) => {
    try {
      const res = await fetch(`${origin}/djangoapp/helpful/${review.id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.status === 200) {
        setReviews((current) => current.map((r) =>
          r.id === review.id ? { ...r, helpful: json.helpful } : r));
        const next = [...voted, review.id];
        setVoted(next);
        localStorage.setItem('helpful_votes', JSON.stringify(next));
      }
    } catch (e) {
      // Voting is best-effort; a failed vote must not break the page.
    }
  };

  const pct = (n) => (summary.total ? (100 * n) / summary.total : 0);

  return (
    <div>
      <Header />
      <div className="dealer_detail_page">
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: '#123c5e', marginBottom: '4px' }}>
              {dealer.full_name || 'Dealer'}
            </h1>
            <h5 style={{ color: '#51606e' }}>
              {dealer.city}, {dealer.address} · Zip {dealer.zip} · {dealer.state}
            </h5>
          </div>
          {isLoggedIn && (
            <a className="btn_primary" href={`/postreview/${id}`}>
              Write a review
            </a>
          )}
        </div>

        {!loaded ? (
          <p className="dealers_hint" style={{ marginTop: '20px' }}>
            Loading dealer and reviews… the first load can take up to a
            minute while the free servers wake up.
          </p>
        ) : summary.total === 0 ? (
          <p className="dealers_hint" style={{ marginTop: '20px' }}>
            No reviews yet for this dealer.
            {isLoggedIn ? ' Be the first to write one.' : ''}
          </p>
        ) : (
          <div>
            <div style={{ marginTop: '14px', fontSize: '16px' }}>
              <strong>{summary.score}% positive</strong> across{' '}
              {summary.total} review{summary.total === 1 ? '' : 's'}
            </div>
            <div className="sentiment_bar" aria-hidden="true">
              <div className="seg_pos" style={{ width: `${pct(summary.counts.positive)}%` }} />
              <div className="seg_neu" style={{ width: `${pct(summary.counts.neutral)}%` }} />
              <div className="seg_neg" style={{ width: `${pct(summary.counts.negative)}%` }} />
            </div>
            <div className="sentiment_legend">
              <span>Positive: {summary.counts.positive}</span>
              <span>Neutral: {summary.counts.neutral}</span>
              <span>Negative: {summary.counts.negative}</span>
            </div>
            {summary.topCars.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ color: '#51606e', marginRight: '8px' }}>
                  Cars bought here:
                </span>
                {summary.topCars.map((car) => (
                  <span key={car} className="review_car_chip"
                    style={{ marginRight: '6px' }}>{car}</span>
                ))}
              </div>
            )}

            <div style={{ marginTop: '22px' }}>
              <label htmlFor="review_sort" style={{ marginRight: '8px' }}>
                Sort reviews
              </label>
              <select id="review_sort" className="dealers_select"
                value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest purchase first</option>
                <option value="oldest">Oldest purchase first</option>
                <option value="helpful">Most helpful first</option>
              </select>
            </div>

            <div className="reviews_panel">
              {sortedReviews.map((review) => (
                <div key={review.id} className="review_card2">
                  <div className="review_card_head">
                    <img src={senti_icon(review.sentiment)}
                      className="emotion_icon" alt={review.sentiment} />
                    <span style={{ fontWeight: 600 }}>{review.name}</span>
                  </div>
                  <div>{review.review}</div>
                  <div style={{ color: '#51606e', fontSize: '13px' }}>
                    <span className="review_car_chip">
                      {review.car_make} {review.car_model} {review.car_year}
                    </span>{' '}
                    Purchased {review.purchase_date}
                  </div>
                  <button type="button" className="helpful_btn"
                    disabled={voted.includes(review.id)}
                    onClick={() => markHelpful(review)}>
                    {voted.includes(review.id)
                      ? `Helpful (${review.helpful || 0}) — thanks`
                      : `Helpful (${review.helpful || 0})`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dealer;
