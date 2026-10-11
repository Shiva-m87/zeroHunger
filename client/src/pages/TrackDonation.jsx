import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { createSocket } from '../socket';
import RouteMap from '../components/RouteMap';
import StatusBadge from '../components/StatusBadge';
import FoodInfo from '../components/FoodInfo';
import { formatDateTime, toLatLng } from '../utils/format';

// Steps shown in the progress timeline
const STEPS = [
  { status: 'available', label: 'Food listed', time: 'createdAt' },
  { status: 'claimed', label: 'Claimed by NGO', time: 'claimedAt' },
  { status: 'assigned', label: 'Delivery person assigned', time: null },
  { status: 'picked_up', label: 'Picked up', time: 'pickedUpAt' },
  { status: 'delivered', label: 'Delivered', time: 'deliveredAt' },
];

// Live tracking page for donor and NGO
export default function TrackDonation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [live, setLive] = useState(null); // delivery person's position
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () =>
      api
        .get(`/donations/${id}`)
        .then((res) => {
          setDonation(res.data);
          if (res.data.liveLocation?.lat != null) setLive(res.data.liveLocation);
        })
        .catch((err) => setError(getErrorMessage(err)));

    load();

    // Join this donation's "room" to receive live updates
    const socket = createSocket();
    socket.on('connect', () => socket.emit('track:join', id)); // also re-joins after a reconnect
    socket.on('location:changed', (location) => setLive(location));
    socket.on('donation:updated', load); // status changed (picked up / delivered)

    return () => socket.disconnect();
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!donation) return <p className="muted">Loading...</p>;

  const currentStep = STEPS.findIndex((s) => s.status === donation.status);

  return (
    <>
      <button className="link-btn muted small" onClick={() => navigate(-1)}>← Back</button>
      <div className="page-header">
        <h1>Tracking: {donation.title}</h1>
        <StatusBadge status={donation.status} />
      </div>

      <div className="task-layout">
        <div>
          {donation.ngo ? (
            <RouteMap pickup={toLatLng(donation.location)} drop={donation.ngo.location} live={live} status={donation.status} />
          ) : (
            <div className="card empty">Map will appear once an NGO claims this food.</div>
          )}
          {live?.updatedAt && <p className="muted small">Last location update: {formatDateTime(live.updatedAt)}</p>}
          {!live && donation.status === 'assigned' && (
            <p className="muted small">Waiting for the delivery person to start sharing location...</p>
          )}
        </div>

        <div className="card">
          <FoodInfo donation={donation} showExpiry={false} />

          {/* Progress timeline */}
          <ol className="timeline">
            {STEPS.map((step, i) => (
              <li key={step.status} className={i <= currentStep ? 'done' : ''}>
                <span>{step.label}</span>
                {i <= currentStep && step.time && donation[step.time] && (
                  <small className="muted">{formatDateTime(donation[step.time])}</small>
                )}
              </li>
            ))}
          </ol>

          <p className="small">🍱 <strong>Donor:</strong> {donation.donor.name} · {donation.donor.phone}</p>
          {donation.ngo && <p className="small">🏢 <strong>NGO:</strong> {donation.ngo.name} · {donation.ngo.phone}</p>}
          {donation.deliveryPerson && (
            <p className="small">🛵 <strong>Delivery:</strong> {donation.deliveryPerson.name} · {donation.deliveryPerson.phone}</p>
          )}

          {donation.pickupOtp && donation.status === 'assigned' && (
            <div className="otp-box">Pickup OTP: <strong>{donation.pickupOtp}</strong></div>
          )}
          {donation.deliveryOtp && ['assigned', 'picked_up'].includes(donation.status) && (
            <div className="otp-box">Delivery OTP: <strong>{donation.deliveryOtp}</strong></div>
          )}
        </div>
      </div>
    </>
  );
}
