import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import FoodInfo from '../../components/FoodInfo';
import useLiveRefresh from '../../utils/useLiveRefresh';
import { formatDateTime, isActiveDelivery } from '../../utils/format';

// Tab 2: food this NGO has claimed - assign delivery, see OTP, track
export default function MyClaims({ staff, goToStaff }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadClaims = () =>
    api
      .get('/donations/claimed')
      .then((res) => setDonations(res.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadClaims();
  }, []);
  useLiveRefresh(loadClaims);

  const assign = async (donationId, deliveryPersonId) => {
    if (!deliveryPersonId) return;
    try {
      await api.patch(`/donations/${donationId}/assign`, { deliveryPersonId });
      loadClaims();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <p className="muted">Loading...</p>;
  if (donations.length === 0) return <div className="card empty">You have not claimed any food yet.</div>;

  return (
    <div className="grid grid-2">
      {donations.map((d) => (
        <div className="card" key={d._id}>
          <div className="card-head">
            <h3>{d.title}</h3>
            <StatusBadge status={d.status} />
          </div>
          <FoodInfo donation={d} showExpiry={d.status === 'claimed'} />
          <p className="small">
            🍱 {d.donor?.name} · {d.donor?.phone}
            <br />
            📍 {d.pickupAddress}
          </p>
          <p className="muted small">Claimed {formatDateTime(d.claimedAt)}</p>

          {/* Assign / re-assign delivery person (allowed until the food is picked up) */}
          {['claimed', 'assigned'].includes(d.status) &&
            (staff.length === 0 ? (
              <p className="notice small">
                Add a delivery person first. <button className="link-btn" onClick={goToStaff}>Add staff</button>
              </p>
            ) : (
              <label className="inline-label">
                {d.status === 'claimed' ? 'Assign delivery:' : 'Delivery person:'}
                <select value={d.deliveryPerson?._id || ''} onChange={(e) => assign(d._id, e.target.value)}>
                  <option value="">-- choose --</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </label>
            ))}

          {/* The NGO gives this OTP to the delivery person when the food arrives */}
          {isActiveDelivery(d.status) && (
            <div className="otp-box">
              Delivery OTP: <strong>{d.deliveryOtp}</strong>
              <small>Tell this to the delivery person only after you receive the food</small>
            </div>
          )}
          {d.status === 'delivered' && <p className="success small">✅ Received on {formatDateTime(d.deliveredAt)}</p>}

          {isActiveDelivery(d.status) && (
            <div className="card-actions">
              <Link to={`/track/${d._id}`} className="btn btn-sm">📍 Track live</Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
