import React, { useMemo, useState, useEffect } from 'react';
import "../Dealers/Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';

const origin = window.location.origin;

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [modelStats, setModelStats] = useState([]);
  const [state, setState] = useState('loading');

  useEffect(() => {
    const load = async () => {
      try {
        const [carsRes, statsRes] = await Promise.all([
          fetch(`${origin}/djangoapp/get_cars`),
          fetch(`${origin}/djangoapp/dealer_stats`),
        ]);
        const carsJson = await carsRes.json();
        const statsJson = await statsRes.json();
        setCars(carsJson.CarModels || []);
        setModelStats(statsJson.models || []);
        setState('ready');
      } catch (e) {
        setState('error');
      }
    };
    load();
  }, []);

  const statsByCar = useMemo(() => {
    const map = {};
    modelStats.forEach((m) => {
      map[`${m.make}|${m.model}`] = m;
    });
    return map;
  }, [modelStats]);

  const grouped = useMemo(() => {
    const groups = {};
    cars.forEach((car) => {
      if (!groups[car.CarMake]) groups[car.CarMake] = [];
      groups[car.CarMake].push(car.CarModel);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cars]);

  return (
    <div>
      <Header />
      <div className="simple_page">
        <h2 style={{ color: '#123c5e' }}>Cars Explorer</h2>
        <p className="dealers_hint">
          Every car make and model in the catalog, with how often each one
          shows up in customer reviews and how positive those reviews are.
        </p>
        {state === 'loading' && (
          <p className="dealers_hint">Loading cars… the first load can take
            up to a minute while the free servers wake up.</p>
        )}
        {state === 'error' && (
          <p className="dealers_hint">Could not load the car catalog.
            Refresh in a few seconds.</p>
        )}
        {state === 'ready' && grouped.map(([make, models]) => (
          <div key={make} className="make_group">
            <h3>{make}</h3>
            {models.sort().map((model) => {
              const stat = statsByCar[`${make}|${model}`];
              return (
                <div key={model} className="model_row">
                  <span><strong>{model}</strong></span>
                  <span style={{ color: '#51606e' }}>
                    {stat
                      ? `${stat.reviews} review${stat.reviews === 1 ? '' : 's'} · ${stat.positive_pct}% positive`
                      : 'No reviews yet'}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        {state === 'ready' && (
          <a className="btn_primary" href="/dealers">
            Browse dealers selling these cars
          </a>
        )}
      </div>
    </div>
  );
};

export default Cars;
