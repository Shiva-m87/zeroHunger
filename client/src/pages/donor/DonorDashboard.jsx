import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import FoodInfo from '../../components/FoodInfo';
import useLiveRefresh from '../../utils/useLiveRefresh';
import { formatDateTime, isActiveDelivery } from '../../utils/format';

export default function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDonations = () =>
    api
      .get('/donations/my')
      .then((res) => setDonations(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadDonations();
  }, []);
  useLiveRefresh(loadDonations); // refresh when an NGO claims / delivery updates

  const cancelDonation = async (id) => {
    if (!window.confirm('Cancel this donation?')) return;
    try {
      await api.patch(`/donations/${id}/cancel`);
      loadDonations();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Numbers for the stat cards
  const delivered = donations.filter((d) => d.status === 'delivered');
  const stats = {
    total: donations.length,
    active: donations.filter((d) => ['available', 'claimed', 'assigned', 'picked_up'].includes(d.status)).length,
    delivered: delivered.length,
    meals: delivered.filter((d) => d.unit === 'servings').reduce((sum, d) => sum + d.quantity, 0),
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My donations</h1>
          <p className="muted">Every meal you share is one less person going hungry.</p>
        </div>
        <Link to="/donor/new" className="btn">+ Donate food</Link>
      </div>

      <div className="grid grid-4 stats">
        <div className="card stat"><span>{stats.total}</span>Total donations</div>
        <div className="card stat"><span>{stats.active}</span>In progress</div>
        <div className="card stat"><span>{stats.delivered}</span>Delivered</div>
        <div className="card stat"><span>{stats.meals}</span>Meals served</div>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && donations.length === 0 && (
        <div className="card empty">
          You have not donated yet. <Link to="/donor/new">Add your first donation</Link>
        </div>
      )}

      <div className="grid grid-2">
        {donations.map((d) => (
          <div className="card" key={d._id}>
            <div className="card-head">
              <h3>{d.title}</h3>
              <StatusBadge status={d.status} />
            </div>
            <FoodInfo donation={d} showExpiry={d.status === 'available'} />
            <p className="muted small">Added {formatDateTime(d.createdAt)}</p>

            {d.ngo && (
              <p className="small">
                🏢 <strong>{d.ngo.name}</strong> · {d.ngo.phone}
              </p>
            )}
            {d.deliveryPerson && (
              <p className="small">
                🛵 {d.deliveryPerson.name} · {d.deliveryPerson.phone}
              </p>
            )}

            {/* The donor gives this OTP to the delivery person at pickup */}
            {['claimed', 'assigned'].includes(d.status) && (
              <div className="otp-box">
                Pickup OTP: <strong>{d.pickupOtp}</strong>
                <small>Share only with the delivery person when they collect the food</small>
              </div>
            )}
            {d.status === 'delivered' && <p className="success small">✅ Delivered on {formatDateTime(d.deliveredAt)}</p>}

            <div className="card-actions">
              {isActiveDelivery(d.status) && (
                <Link to={`/track/${d._id}`} className="btn btn-sm">📍 Track live</Link>
              )}
              {d.status === 'available' && (
                <button className="btn btn-danger btn-sm" onClick={() => cancelDonation(d._id)}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
