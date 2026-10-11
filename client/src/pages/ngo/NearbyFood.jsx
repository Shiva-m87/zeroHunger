import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from 'react-leaflet';
import api, { getErrorMessage } from '../../api';
import { useAuth } from '../../context/AuthContext';
import FoodInfo from '../../components/FoodInfo';
import useLiveRefresh from '../../utils/useLiveRefresh';
import { toLatLng } from '../../utils/format';

// Tab 1: food available within X km of the NGO, most urgent first
export default function NearbyFood({ onClaimed }) {
  const { user } = useAuth();
  const [radius, setRadius] = useState(10);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNearby = () => {
    if (!user.isVerified) return setLoading(false);
    api
      .get(`/donations/nearby?radius=${radius}`)
      .then((res) => {
        setDonations(res.data);
        setError('');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, user.isVerified]); // reload when radius changes
  useLiveRefresh(loadNearby); // new food appears without refreshing the page

  const claim = async (id) => {
    try {
      await api.patch(`/donations/${id}/claim`);
      onClaimed(); // switch to "My claims" tab
    } catch (err) {
      alert(getErrorMessage(err));
      loadNearby();
    }
  };

  if (!user.isVerified) return <div className="card empty">Food listings will appear here after verification.</div>;

  return (
    <>
      <div className="toolbar">
        <label className="inline-label">
          Show food within
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[5, 10, 25, 50].map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </label>
        <span className="muted small">{donations.length} donations found · sorted by urgency</span>
      </div>

      {/* Overview map: NGO in blue, food in green */}
      <MapContainer center={[user.location.lat, user.location.lng]} zoom={12} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={[user.location.lat, user.location.lng]} radius={radius * 1000} pathOptions={{ color: '#2563eb', fillOpacity: 0.04 }} />
        <CircleMarker center={[user.location.lat, user.location.lng]} radius={10} pathOptions={{ color: '#2563eb', fillOpacity: 0.8 }}>
          <Tooltip>Your NGO</Tooltip>
        </CircleMarker>
        {donations.map((d) => {
          const p = toLatLng(d.location);
          return (
            <CircleMarker key={d._id} center={[p.lat, p.lng]} radius={9} pathOptions={{ color: '#16a34a', fillOpacity: 0.8 }}>
              <Tooltip>{d.title} · {d.quantity} {d.unit}</Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && donations.length === 0 && <div className="card empty">No food available nearby right now. Try a bigger radius.</div>}

      <div className="grid grid-2">
        {donations.map((d) => (
          <div className="card" key={d._id}>
            <div className="card-head">
              <h3>{d.title}</h3>
              <span className="distance">{d.distanceKm} km away</span>
            </div>
            <FoodInfo donation={d} />
            <p className="small">🍱 {d.donor?.name} · {d.pickupAddress}</p>
            <div className="card-actions">
              <button className="btn btn-sm" onClick={() => claim(d._id)}>Claim this food</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
