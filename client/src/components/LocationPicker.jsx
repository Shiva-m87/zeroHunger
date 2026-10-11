import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi - only used before a location is picked

// Listens for clicks on the map and reports the clicked point
function ClickHandler({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

// Moves the map to the picked point (e.g. after "Use my location")
function Recenter({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 14));
  }, [point, map]);
  return null;
}

/*
  A map where the user clicks to choose a location.
  value    = { lat, lng } or null
  onChange = function that receives the new { lat, lng }
*/
export default function LocationPicker({ value, onChange }) {
  const [error, setError] = useState('');

  const useMyLocation = () => {
    setError('');
    if (!navigator.geolocation) return setError('Your browser does not support location');
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Could not get your location. Please click on the map instead.')
    );
  };

  const center = value || DEFAULT_CENTER;

  return (
    <div>
      <div className="picker-bar">
        <span className="muted small">
          {value ? `📍 ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : 'Click on the map to set the location'}
        </span>
        <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}>
          Use my current location
        </button>
      </div>
      {error && <p className="error small">{error}</p>}

      <MapContainer center={[center.lat, center.lng]} zoom={12} className="map map-small">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <Recenter point={value} />
        {value && <CircleMarker center={[value.lat, value.lng]} radius={10} pathOptions={{ color: '#16a34a', fillOpacity: 0.7 }} />}
      </MapContainer>
    </div>
  );
}
