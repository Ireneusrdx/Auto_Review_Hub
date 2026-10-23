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
      {/* Tiles come from CARTO's free basemap service. The raw
          tile.openstreetmap.org endpoint 403-blocks this app under
          OSM's tile usage policy, which left the map covered in
          "Access blocked" tiles; CARTO serves the same OpenStreetMap
          data under its free basemap terms with attribution. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        subdomains="abcd"
        maxZoom={20}
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
