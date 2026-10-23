import React, { useMemo, useState, useEffect } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import DealersMap from './DealersMap';

const origin = window.location.origin;

const scoreClass = (score) => {
  if (score === null || score === undefined) return 'score_none';
  if (score >= 70) return 'score_good';
  if (score >= 40) return 'score_mid';
  return 'score_low';
};

const ScoreBadge = ({ stat }) => {
  if (!stat || !stat.reviews) {
    return <span className="score_badge score_none">No reviews yet</span>;
  }
  return (
    <span className={`score_badge ${scoreClass(stat.score)}`}
      title={`${stat.positive} of ${stat.reviews} reviews are positive`}>
      {stat.score}% positive
    </span>
  );
};

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [stats, setStats] = useState({});
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [view, setView] = useState('list');
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const isLoggedIn = sessionStorage.getItem("username") != null;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dealersRes, statsRes] = await Promise.all([
        fetch(`${origin}/djangoapp/get_dealers`),
        fetch(`${origin}/djangoapp/dealer_stats`),
      ]);
      const dealersJson = await dealersRes.json();
      const statsJson = await statsRes.json();
      if (dealersJson.status !== 200) throw new Error('dealers');
      const all = Array.from(dealersJson.dealers || []);
      setDealersList(all);
      setStates(Array.from(new Set(all.map((d) => d.state))).sort());
      if (statsJson.status === 200) setStats(statsJson.dealers || {});
    } catch (e) {
      setError('Could not load dealerships. The free servers may still be '
        + 'waking up — wait a few seconds and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = dealersList.filter((dealer) => {
      const matchesState = stateFilter === 'All' || dealer.state === stateFilter;
      const matchesSearch = !term
        || dealer.full_name.toLowerCase().includes(term)
        || dealer.city.toLowerCase().includes(term);
      return matchesState && matchesSearch;
    });
    const statOf = (d) => stats[String(d.id)] || { reviews: 0, score: null };
    if (sortBy === 'score') {
      list.sort((a, b) => (statOf(b).score ?? -1) - (statOf(a).score ?? -1));
    } else if (sortBy === 'reviews') {
      list.sort((a, b) => statOf(b).reviews - statOf(a).reviews);
    } else {
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    return list;
  }, [dealersList, stats, search, stateFilter, sortBy]);

  const toggleCompare = (id) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const compareDealers = dealersList.filter((d) => compareIds.includes(d.id));

  return (
    <div>
      <Header />
      <div className="dealers_page">
        <div className="dealers_controls">
          <input
            className="dealers_search"
            type="text"
            placeholder="Search by dealer name or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="dealers_select" value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}>
            <option value="All">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <select className="dealers_select" value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}>
            <option value="score">Sort: Highest rated</option>
            <option value="reviews">Sort: Most reviewed</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
          <div className="view_toggle" role="group" aria-label="View">
            <button type="button"
              className={view === 'list' ? 'toggle_active' : ''}
              onClick={() => setView('list')}>List</button>
            <button type="button"
              className={view === 'map' ? 'toggle_active' : ''}
              onClick={() => setView('map')}>Map</button>
          </div>
        </div>

        {loading ? (
          <div>
            <p className="dealers_hint">Loading dealers… the first load can
              take up to a minute while the free servers wake up.</p>
            <div className="dealer_grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="dealer_card skeleton_card">
                  <div className="skeleton_line wide" />
                  <div className="skeleton_line" />
                  <div className="skeleton_line narrow" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="dealers_error">
            <p>{error}</p>
            <button type="button" className="btn_primary" onClick={load}>
              Retry
            </button>
          </div>
        ) : view === 'map' ? (
          <DealersMap dealers={visible} />
        ) : visible.length === 0 ? (
          <p className="dealers_hint">No dealerships match your search.</p>
        ) : (
          <div className="dealer_grid">
            {visible.map((dealer) => {
              const stat = stats[String(dealer.id)];
              const selected = compareIds.includes(dealer.id);
              return (
                <div key={dealer.id}
                  className={`dealer_card${selected ? ' card_selected' : ''}`}>
                  <div className="dealer_card_top">
                    <a className="dealer_name" href={`/dealer/${dealer.id}`}>
                      {dealer.full_name}
                    </a>
                    <ScoreBadge stat={stat} />
                  </div>
                  <div className="dealer_meta">
                    {dealer.city}, {dealer.state} · {dealer.address} · {dealer.zip}
                  </div>
                  <div className="dealer_reviews_line">
                    {stat && stat.reviews
                      ? `${stat.reviews} review${stat.reviews === 1 ? '' : 's'}`
                      : 'No reviews yet'}
                    {stat && stat.top_makes && stat.top_makes.length > 0 && (
                      <span> · Sells {stat.top_makes.join(', ')}</span>
                    )}
                  </div>
                  <div className="dealer_card_actions">
                    <a className="btn_primary" href={`/dealer/${dealer.id}`}>
                      View reviews
                    </a>
                    {isLoggedIn && (
                      <a className="btn_ghost" href={`/postreview/${dealer.id}`}>
                        Write a review
                      </a>
                    )}
                    <label className="compare_check">
                      <input type="checkbox" checked={selected}
                        onChange={() => toggleCompare(dealer.id)} />
                      Compare
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {compareIds.length > 0 && (
        <div className="compare_bar">
          <span>
            Comparing {compareIds.length} of 3:
            {' '}{compareDealers.map((d) => d.short_name).join(', ')}
          </span>
          <span className="compare_bar_actions">
            <button type="button" className="btn_primary"
              disabled={compareIds.length < 2}
              onClick={() => setShowCompare(true)}>
              Compare now
            </button>
            <button type="button" className="btn_ghost_light"
              onClick={() => setCompareIds([])}>
              Clear
            </button>
          </span>
        </div>
      )}

      {showCompare && (
        <div className="compare_overlay"
          onClick={() => setShowCompare(false)}>
          <div className="compare_panel" onClick={(e) => e.stopPropagation()}>
            <div className="compare_panel_head">
              <h3>Dealer comparison</h3>
              <button type="button" className="btn_ghost"
                onClick={() => setShowCompare(false)}>Close</button>
            </div>
            <table className="compare_table">
              <thead>
                <tr>
                  <th></th>
                  {compareDealers.map((d) => (
                    <th key={d.id}>{d.full_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Location</td>
                  {compareDealers.map((d) => (
                    <td key={d.id}>{d.city}, {d.state}</td>
                  ))}
                </tr>
                <tr>
                  <td>Positive score</td>
                  {compareDealers.map((d) => {
                    const s = stats[String(d.id)];
                    return <td key={d.id}>
                      {s && s.reviews ? `${s.score}%` : 'No reviews'}
                    </td>;
                  })}
                </tr>
                <tr>
                  <td>Reviews</td>
                  {compareDealers.map((d) => {
                    const s = stats[String(d.id)];
                    return <td key={d.id}>{s ? s.reviews : 0}</td>;
                  })}
                </tr>
                <tr>
                  <td>Positive / Neutral / Negative</td>
                  {compareDealers.map((d) => {
                    const s = stats[String(d.id)];
                    return <td key={d.id}>
                      {s ? `${s.positive} / ${s.neutral} / ${s.negative}` : '0 / 0 / 0'}
                    </td>;
                  })}
                </tr>
                <tr>
                  <td>Top car makes sold</td>
                  {compareDealers.map((d) => {
                    const s = stats[String(d.id)];
                    return <td key={d.id}>
                      {s && s.top_makes.length ? s.top_makes.join(', ') : '—'}
                    </td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
