/*
  Shortest road route using OSRM (free open-source routing engine, no API key needed).
  We send the stops in order and OSRM returns the shortest driving path through them.

  stops: [{ lat, lng }, { lat, lng }, ...]
  returns: { path: [[lat, lng], ...], distanceKm, durationMin }
*/
export async function getRoute(stops) {
  // OSRM wants "lng,lat;lng,lat;..."
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error('No route found');

  const route = data.routes[0];
  return {
    // GeoJSON gives [lng, lat]; Leaflet needs [lat, lng]
    path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.round(route.duration / 60),
  };
}

// Link that opens turn-by-turn navigation in Google Maps
export const googleMapsLink = ({ lat, lng }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
