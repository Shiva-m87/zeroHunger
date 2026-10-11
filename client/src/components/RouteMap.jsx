import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { getRoute } from '../utils/routing';

// Marker colours (also used in the legend below the map)
const COLORS = { pickup: '#16a34a', drop: '#2563eb', live: '#f97316' };

// Zooms the map so the whole route is visible (only when fitKey changes, not on every render)
function FitBounds({ points, fitKey }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

/*
  Shows the delivery route on a map.
  pickup = donor location, drop = NGO location, live = delivery person's current location (optional)
  status = donation status (after pickup we only need to route to the NGO)
*/
export default function RouteMap({ pickup, drop, live, status }) {
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState(false);

  // Build the list of stops in visiting order
  const foodCollected = status === 'picked_up' || status === 'delivered';
  const stops = [];
  if (live) stops.push(live); // start from where the delivery person is now
  if (!foodCollected || !live) stops.push(pickup); // go to pickup (or start there if we have no GPS yet)
  stops.push(drop);

  // Rounded to ~100 m so we don't ask OSRM for a new route on every tiny GPS movement
  const routeKey = stops.map((s) => `${s.lat.toFixed(3)},${s.lng.toFixed(3)}`).join('|');

  useEffect(() => {
    let cancelled = false;
    getRoute(stops)
      .then((r) => {
        if (!cancelled) {
          setRoute(r);
          setRouteError(false);
        }
      })
      .catch(() => !cancelled && setRouteError(true));
    return () => {
      cancelled = true; // ignore late answers if the stops changed meanwhile
    };
    // re-run only when the rounded stops change (routeKey), not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // If routing fails, draw straight lines between stops instead
  const path = route && !routeError ? route.path : stops.map((s) => [s.lat, s.lng]);

  return (
    <div>
      {route && !routeError && (
        <div className="route-summary">
          🛣️ <strong>{route.distanceKm} km</strong> · about <strong>{route.durationMin} min</strong> by road
        </div>
      )}
      {routeError && <p className="muted small">Route service unavailable – showing straight lines.</p>}

      <MapContainer center={[pickup.lat, pickup.lng]} zoom={13} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={path} fitKey={`${routeKey}-${Boolean(route)}`} />
        <Polyline positions={path} pathOptions={{ color: '#7c3aed', weight: 5, dashArray: routeError ? '8 8' : null }} />

        <CircleMarker center={[pickup.lat, pickup.lng]} radius={10} pathOptions={{ color: COLORS.pickup, fillOpacity: 0.8 }}>
          <Tooltip>Pickup (donor)</Tooltip>
        </CircleMarker>
        <CircleMarker center={[drop.lat, drop.lng]} radius={10} pathOptions={{ color: COLORS.drop, fillOpacity: 0.8 }}>
          <Tooltip>Drop (NGO)</Tooltip>
        </CircleMarker>
        {live && (
          <CircleMarker center={[live.lat, live.lng]} radius={9} pathOptions={{ color: COLORS.live, fillOpacity: 1 }}>
            <Tooltip permanent>🛵 Delivery</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      <div className="legend">
        <span><i style={{ background: COLORS.pickup }} /> Pickup</span>
        <span><i style={{ background: COLORS.drop }} /> NGO</span>
        <span><i style={{ background: COLORS.live }} /> Delivery person</span>
      </div>
    </div>
  );
}
