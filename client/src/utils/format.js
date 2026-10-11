// Small helper functions used across pages

// Where each role lands after login
export const dashboardPath = (role) =>
  ({ donor: '/donor', ngo: '/ngo', delivery: '/delivery', admin: '/admin' })[role] || '/';

// "12 Oct, 7:30 pm"
export const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : '-';

// "2h 15m left" / "Expired"
export function timeLeft(expiresAt) {
  const minutes = Math.floor((new Date(expiresAt) - Date.now()) / 60000);
  if (minutes <= 0) return 'Expired';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

// Donation stores GeoJSON [lng, lat]; Leaflet wants { lat, lng }
export const toLatLng = (location) =>
  location?.coordinates ? { lat: location.coordinates[1], lng: location.coordinates[0] } : null;

// Is the delivery still going on?
export const isActiveDelivery = (status) => ['assigned', 'picked_up'].includes(status);
