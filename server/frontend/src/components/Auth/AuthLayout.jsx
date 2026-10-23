import React from 'react';
import './Auth.css';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="auth_check">
    <path d="M4 12.5 9.5 18 20 6.5" />
  </svg>
);

// Shared split-screen frame for the login and register pages: a visual
// panel with the dealership photo and what membership unlocks, and a
// clean form panel. The pages supply their own heading and form.
const AuthLayout = ({ visualTitle, visualText, heading, subheading, children }) => (
  <div className="auth_page">
    <aside className="auth_visual">
      <a className="auth_brand" href="/">Auto Review Hub</a>
      <div className="auth_visual_body">
        <h2>{visualTitle}</h2>
        <p>{visualText}</p>
        <ul>
          <li><CheckIcon /> Dealer reputation scores from real reviews</li>
          <li><CheckIcon /> Map, search and side-by-side comparison</li>
          <li><CheckIcon /> Cars Explorer with photos of every model</li>
          <li><CheckIcon /> Post reviews and track them in My Reviews</li>
        </ul>
      </div>
      <div className="auth_visual_foot">
        Dealership reviews with sentiment analysis
      </div>
    </aside>
    <main className="auth_form_side">
      <div className="auth_form_card">
        <h1>{heading}</h1>
        <p className="auth_sub">{subheading}</p>
        {children}
      </div>
    </main>
  </div>
);

export default AuthLayout;
