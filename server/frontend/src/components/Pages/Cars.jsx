import React, { useMemo, useState, useEffect } from 'react';
import "../Dealers/Dealers.css";
import "../assets/style.css";
import "./Cars.css";
import Header from '../Header/Header';
import carImages from './carImages.json';

const origin = window.location.origin;

const CarCard = ({ make, model, stat }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const info = carImages[`${make}|${model}`];
  const displayMake = info ? info.make_display : make;
  const showImage = info && !imgFailed;

  return (
    <article className="car_card">
      <div className="car_card_media">
        {showImage ? (
          <img
            src={info.img}
            alt={`${displayMake} ${model}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="car_card_placeholder" aria-hidden="true">
            <span>{model.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="car_card_body">
        <div className="car_card_make">{displayMake}</div>
        <h4>{model}</h4>
        <div className="car_card_stats">
          {stat ? (
            <>
              <span>{stat.reviews} review{stat.reviews === 1 ? '' : 's'}</span>
              <span className={
                `car_pct ${stat.positive_pct >= 70 ? 'good'
                  : stat.positive_pct >= 40 ? 'mid' : 'low'}`
              }>
                {stat.positive_pct}% positive
              </span>
            </>
          ) : (
            <span className="car_no_reviews">No reviews yet</span>
          )}
        </div>
        <div className="car_card_links">
          <a href="/dealers">Find dealers</a>
          {info && (
            <a href={info.source} target="_blank" rel="noreferrer">
              About this model
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [modelStats, setModelStats] = useState([]);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState('');

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
    const q = query.trim().toLowerCase();
    const groups = {};
    cars.forEach((car) => {
      const info = carImages[`${car.CarMake}|${car.CarModel}`];
      const displayMake = info ? info.make_display : car.CarMake;
      const haystack = `${displayMake} ${car.CarMake} ${car.CarModel}`.toLowerCase();
      if (q && !haystack.includes(q)) return;
      if (!groups[car.CarMake]) groups[car.CarMake] = [];
      groups[car.CarMake].push(car.CarModel);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cars, query]);

  return (
    <div>
      <Header />
      <div className="simple_page cars_page">
        <h2 style={{ color: '#123c5e' }}>Cars Explorer</h2>
        <p className="dealers_hint">
          Every car in the catalog with a photo of the exact model, plus how
          often each one shows up in customer reviews and how positive those
          reviews are.
        </p>

        <div className="cars_controls">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by make or model"
            aria-label="Search cars by make or model"
          />
        </div>

        {state === 'loading' && (
          <p className="dealers_hint">Loading cars… the first load can take
            up to a minute while the free servers wake up.</p>
        )}
        {state === 'error' && (
          <p className="dealers_hint">Could not load the car catalog.
            Refresh in a few seconds.</p>
        )}
        {state === 'ready' && grouped.length === 0 && (
          <p className="dealers_hint">No cars match "{query}".</p>
        )}
        {state === 'ready' && grouped.map(([make, models]) => {
          const info = carImages[`${make}|${models[0]}`];
          const displayMake = info ? info.make_display : make;
          return (
            <div key={make} className="make_group">
              <h3>{displayMake}</h3>
              <div className="car_grid">
                {models.sort().map((model) => (
                  <CarCard
                    key={model}
                    make={make}
                    model={model}
                    stat={statsByCar[`${make}|${model}`]}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {state === 'ready' && (
          <>
            <a className="btn_primary" href="/dealers">
              Browse dealers selling these cars
            </a>
            <p className="cars_attribution">
              Car photos from Wikipedia and Wikimedia Commons, matched to
              each catalog model. "About this model" opens the source
              article for every car.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Cars;
