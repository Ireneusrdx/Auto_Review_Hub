import React, { useEffect, useMemo, useState } from 'react';
import Header from '../Header/Header';
import './Landing.css';

const origin = window.location.origin;

const IconChart = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="landing_icon">
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </svg>
);

const IconMap = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="landing_icon">
    <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

const IconCompare = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="landing_icon">
    <path d="M8 3v18M16 3v18M3 8h5M3 16h5M16 7h5M16 17h5" />
  </svg>
);

const IconReview = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="landing_icon">
    <path d="M5 4h14v11H9l-4 4V4Z" />
    <path d="M8.5 9h7M8.5 12h4.5" />
  </svg>
);

const Landing = () => {
  const [summary, setSummary] = useState(null);
  const [spotlight, setSpotlight] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [dealersResponse, statsResponse] = await Promise.all([
          fetch(`${origin}/djangoapp/get_dealers`),
          fetch(`${origin}/djangoapp/dealer_stats`),
        ]);
        const dealersJson = await dealersResponse.json();
        const statsJson = await statsResponse.json();
        const dealers = dealersJson.dealers || [];
        const dealerStats = statsJson.dealers || {};

        setSummary({
          dealers: dealers.length,
          states: new Set(dealers.map((dealer) => dealer.state)).size,
          reviews: statsJson.total_reviews || 0,
        });

        const ranked = dealers
          .map((dealer) => ({
            dealer,
            stat: dealerStats[String(dealer.id)],
          }))
          .filter(({ stat }) => stat && stat.reviews > 0 && stat.score !== null)
          .sort((a, b) => b.stat.score - a.stat.score
            || b.stat.reviews - a.stat.reviews);
        if (ranked.length > 0) setSpotlight(ranked[0]);
      } catch (error) {
        // The landing page still explains the product if the free
        // backends are asleep; the live counters simply stay hidden.
      }
    };
    loadSummary();
  }, []);

  const spotlightDealer = useMemo(
    () => (spotlight ? spotlight.dealer : null),
    [spotlight]
  );

  return (
    <div className="landing_page">
      <Header />
      <main>
        <section className="landing_hero">
          <div className="landing_hero_copy">
            <div className="landing_eyebrow">Dealership reviews, decoded by sentiment</div>
            <h1>Find a dealer you can trust before you buy.</h1>
            <p>
              Auto Review Hub brings dealerships across the United States,
              customer reviews and sentiment analysis into one place, so you
              can compare real buying experiences before visiting a showroom.
            </p>
            <div className="landing_actions">
              <a className="landing_btn landing_btn_primary" href="/login">Login</a>
              <a className="landing_btn landing_btn_secondary" href="/register">Create an account</a>
            </div>
            <p className="landing_access_note">
              Members get access to dealer scores, maps, comparisons, the cars
              explorer and review posting.
            </p>
            {summary && (
              <div className="landing_stats" aria-label="Auto Review Hub coverage">
                <div>
                  <strong>{summary.dealers}</strong>
                  <span>dealerships</span>
                </div>
                <div>
                  <strong>{summary.states}</strong>
                  <span>states covered</span>
                </div>
                <div>
                  <strong>{summary.reviews}</strong>
                  <span>customer reviews</span>
                </div>
              </div>
            )}
          </div>

          <div className="landing_visual">
            <img
              src={`${origin}/static/car_dealership.jpg`}
              alt="Cars lined up at a dealership"
            />
            {spotlightDealer && (
              <div className="landing_spotlight">
                <span>Top rated right now</span>
                <strong>{spotlightDealer.full_name}</strong>
                <p>
                  {spotlightDealer.city}, {spotlightDealer.state} · {spotlight.stat.score}% positive
                  from {spotlight.stat.reviews} review{spotlight.stat.reviews === 1 ? '' : 's'}
                </p>
                <a href="/login">Login to explore this dealer</a>
              </div>
            )}
          </div>
        </section>

        <section className="landing_section">
          <div className="landing_section_head">
            <span>Why Auto Review Hub</span>
            <h2>More than a list of dealerships</h2>
            <p>
              Every major screen is built around the question a buyer actually
              asks: what was it like to buy a car there?
            </p>
          </div>
          <div className="landing_feature_grid">
            <article>
              <IconChart />
              <h3>Sentiment-backed scores</h3>
              <p>Dealer cards turn customer reviews into a clear positive score and sentiment split.</p>
            </article>
            <article>
              <IconMap />
              <h3>Search and map dealers</h3>
              <p>Filter by state, search by city or name, and switch to a map built from dealer locations.</p>
            </article>
            <article>
              <IconCompare />
              <h3>Compare before you commit</h3>
              <p>Put up to three dealerships side by side on score, review volume and cars sold.</p>
            </article>
            <article>
              <IconReview />
              <h3>Share your experience</h3>
              <p>Post a review after purchase and keep every review you have written in one place.</p>
            </article>
          </div>
        </section>

        <section className="landing_steps_band">
          <div>
            <span>1</span>
            <h3>Create your account</h3>
            <p>Register once to unlock the full dealership directory.</p>
          </div>
          <div>
            <span>2</span>
            <h3>Compare real reviews</h3>
            <p>Use scores, sentiment breakdowns and maps to shortlist dealers.</p>
          </div>
          <div>
            <span>3</span>
            <h3>Buy with context</h3>
            <p>Visit the showroom knowing what other customers experienced.</p>
          </div>
        </section>

        <section className="landing_cta">
          <div>
            <h2>Start with the dealers, not the sales pitch.</h2>
            <p>Login or create a free account to open the full Auto Review Hub experience.</p>
          </div>
          <div className="landing_actions">
            <a className="landing_btn landing_btn_primary" href="/login">Login</a>
            <a className="landing_btn landing_btn_secondary" href="/register">Register</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
