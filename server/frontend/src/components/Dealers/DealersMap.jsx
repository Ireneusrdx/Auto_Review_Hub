import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Webpack does not rewrite Leaflet's default icon URLs, so point the
// default icon at the bundled images explicitly.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DealersMap = ({ dealers }) => {
  const points = dealers.filter(
    (d) => !Number.isNaN(parseFloat(d.lat)) && !Number.isNaN(parseFloat(d.long))
  );
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height: '520px', width: '100%', borderRadius: '10px' }}
      scrollWheelZoom={false}
    >
      {/* Tile source history: tile.openstreetmap.org 403-blocks this
          app under OSM's tile usage policy ("Access blocked" tiles),
          and CARTO's basemap CDN now stamps "API KEY REQUIRED" on its
          tiles for keyless browser use. Esri's World Street Map tile
          service is the remaining genuinely key-free option: it serves
          real street tiles to browsers with attribution only. Note the
          ArcGIS tile order is {z}/{y}/{x}. */}
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      {points.map((dealer) => (
        <Marker
          key={dealer.id}
          position={[parseFloat(dealer.lat), parseFloat(dealer.long)]}
        >
          <Popup>
            <strong>{dealer.full_name}</strong>
            <br />
            {dealer.city}, {dealer.state}
            <br />
            <a href={`/dealer/${dealer.id}`}>View reviews</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default DealersMap;
