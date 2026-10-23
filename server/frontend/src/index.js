import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { BrowserRouter } from "react-router-dom";
import 'leaflet/dist/leaflet.css';

// BrowserRouter, not HashRouter: Django serves the built app at /login,
// /register, /dealers, /dealer/<id> and /postreview/<id> (see
// djangoproj/urls.py), and every component navigates with plain paths
// like /dealer/5. With HashRouter those paths never match a route and
// every dealer link lands back on the dealers list.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);
