import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import "./PostReview.css";
import Header from '../Header/Header';
import { flashToast } from '../Toast/Toast';

const MAX_YEAR = new Date().getFullYear();

const PostReview = () => {
  const [dealer, setDealer] = useState({});
  const [dealerStat, setDealerStat] = useState(null);
  const [review, setReview] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);
  const [posting, setPosting] = useState(false);

  let root_url = window.location.origin + "/";
  let params = useParams();
  let id = params.id;
  let dealer_url = root_url + `djangoapp/dealer/${id}`;
  let review_url = root_url + `djangoapp/add_review`;
  let carmodels_url = root_url + `djangoapp/get_cars`;
  let stats_url = root_url + `djangoapp/dealer_stats`;

  const reviewerName = useMemo(() => {
    let name = sessionStorage.getItem("firstname") + " " +
      sessionStorage.getItem("lastname");
    if (name.includes("null")) {
      name = sessionStorage.getItem("username");
    }
    return name || "";
  }, []);

  const makes = useMemo(
    () => [...new Set(carmodels.map((c) => c.CarMake))].sort(),
    [carmodels]
  );
  const modelsForMake = useMemo(
    () => carmodels.filter((c) => c.CarMake === make)
      .map((c) => c.CarModel).sort(),
    [carmodels, make]
  );

  const missing = [];
  if (review.trim() === "") missing.push("your review");
  if (date === "") missing.push("the purchase date");
  if (make === "" || model === "") missing.push("the car make and model");
  if (year === "") missing.push("the car year");

  const postreview = async () => {
    if (missing.length > 0) {
      flashToast(`Please add ${missing.join(", ")} before posting.`, 'error');
      return;
    }
    setPosting(true);
    let jsoninput = JSON.stringify({
      "name": reviewerName,
      "dealership": id,
      "review": review,
      "purchase": true,
      "purchase_date": date,
      "car_make": make,
      "car_model": model,
      "car_year": year,
    });

    try {
      const res = await fetch(review_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsoninput,
      });
      const json = await res.json();
      if (json.status === 200) {
        flashToast('Your review was posted.');
        window.location.href = window.location.origin + "/dealer/" + id;
      } else {
        flashToast('Your review could not be posted. Please try again.', 'error');
        setPosting(false);
      }
    } catch (error) {
      flashToast('Your review could not be posted. Please try again.', 'error');
      setPosting(false);
    }
  };

  const get_dealer = async () => {
    const res = await fetch(dealer_url, { method: "GET" });
    const retobj = await res.json();
    if (retobj.status === 200) {
      let dealerobjs = Array.from(retobj.dealer);
      if (dealerobjs.length > 0)
        setDealer(dealerobjs[0]);
    }
  };

  const get_cars = async () => {
    const res = await fetch(carmodels_url, { method: "GET" });
    const retobj = await res.json();
    setCarmodels(Array.from(retobj.CarModels));
  };

  const get_stats = async () => {
    try {
      const res = await fetch(stats_url, { method: "GET" });
      const retobj = await res.json();
      if (retobj.dealers && retobj.dealers[String(id)]) {
        setDealerStat(retobj.dealers[String(id)]);
      }
    } catch (error) {
      // The composer works without the reputation summary.
    }
  };

  useEffect(() => {
    get_dealer();
    get_cars();
    get_stats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreClass = dealerStat
    ? (dealerStat.score >= 70 ? 'good' : dealerStat.score >= 40 ? 'mid' : 'low')
    : '';

  return (
    <div>
      <Header />
      <div className="pr_page">
        <div className="pr_dealer_card">
          <div>
            <div className="pr_eyebrow">Write a review</div>
            <h1>{dealer.full_name || 'Loading dealership...'}</h1>
            {dealer.city && (
              <p className="pr_dealer_meta">
                {dealer.address} · {dealer.city}, {dealer.state} · {dealer.zip}
              </p>
            )}
          </div>
          {dealerStat && (
            <div className={`pr_score_box ${scoreClass}`}>
              <strong>{dealerStat.score}% positive</strong>
              <span>from {dealerStat.reviews} review{dealerStat.reviews === 1 ? '' : 's'} so far</span>
            </div>
          )}
        </div>

        <div className="pr_layout">
          <div className="pr_form_card">
            <div className="pr_field">
              <label htmlFor="review">Your review <span className="pr_required">*</span></label>
              <textarea
                id="review"
                rows="7"
                maxLength="1000"
                placeholder="How was the buying experience? Talk about the staff, the pricing, the paperwork and whether you would buy here again."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div className="pr_char_count">{review.length}/1000</div>
            </div>

            <div className="pr_grid">
              <div className="pr_field">
                <label htmlFor="purchase_date">Purchase date <span className="pr_required">*</span></label>
                <input
                  id="purchase_date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="pr_field">
                <label htmlFor="car_year">Car year <span className="pr_required">*</span></label>
                <input
                  id="car_year"
                  type="number"
                  min="1990"
                  max={MAX_YEAR}
                  placeholder={String(MAX_YEAR)}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div className="pr_field">
                <label htmlFor="car_make">Car make <span className="pr_required">*</span></label>
                <select
                  id="car_make"
                  value={make}
                  onChange={(e) => { setMake(e.target.value); setModel(""); }}
                >
                  <option value="" disabled>Choose a make</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="pr_field">
                <label htmlFor="car_model">Car model <span className="pr_required">*</span></label>
                <select
                  id="car_model"
                  value={model}
                  disabled={make === ""}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="" disabled>
                    {make === "" ? 'Choose a make first' : 'Choose a model'}
                  </option>
                  {modelsForMake.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pr_actions">
              <button
                className="pr_submit"
                onClick={postreview}
                disabled={posting}
              >
                {posting ? 'Posting...' : 'Post Review'}
              </button>
              <a className="pr_cancel" href={`/dealer/${id}`}>Cancel</a>
              <span className="pr_posting_as">
                Posting as <strong>{reviewerName}</strong>
              </span>
            </div>
          </div>

          <aside className="pr_side">
            <div className="pr_preview_card">
              <div className="pr_side_title">How your review will look</div>
              <div className="pr_preview_head">
                <span className="pr_avatar">
                  {(reviewerName || '?').trim().charAt(0).toUpperCase()}
                </span>
                <strong>{reviewerName || 'Your name'}</strong>
              </div>
              <p className="pr_preview_text">
                {review.trim() !== ""
                  ? review
                  : 'Your review text will appear here as you type.'}
              </p>
              <div className="pr_preview_meta">
                {(make || model) && (
                  <span className="pr_car_chip">
                    {[make, model, year].filter(Boolean).join(' ')}
                  </span>
                )}
                {date && <span>Purchased {date}</span>}
              </div>
              <p className="pr_preview_note">
                Sentiment (positive, neutral or negative) is calculated
                automatically from your words when the review is posted.
              </p>
            </div>

            <div className="pr_tips_card">
              <div className="pr_side_title">What makes a review useful</div>
              <ul>
                <li>Name the salesperson or team if they stood out, good or bad.</li>
                <li>Say whether the final price matched what was quoted.</li>
                <li>Mention how long the paperwork and delivery took.</li>
                <li>End with whether you would buy from this dealer again.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
export default PostReview;
