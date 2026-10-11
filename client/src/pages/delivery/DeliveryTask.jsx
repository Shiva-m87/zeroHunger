import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import { createSocket } from '../../socket';
import RouteMap from '../../components/RouteMap';
import StatusBadge from '../../components/StatusBadge';
import FoodInfo from '../../components/FoodInfo';
import { googleMapsLink } from '../../utils/routing';
import { isActiveDelivery, toLatLng } from '../../utils/format';

/*
  The delivery person's working screen:
  - shows shortest route: me -> donor (pickup) -> NGO (drop)
  - shares my GPS location live with donor and NGO
  - OTP check at pickup and at drop
*/
export default function DeliveryTask() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const loadTask = () =>
    api
      .get(`/donations/${id}`)
      .then((res) => setTask(res.data))
      .catch((err) => setError(getErrorMessage(err)));

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const active = task && isActiveDelivery(task.status);

  // While the delivery is active: watch GPS and send every new position to the server
  useEffect(() => {
    if (!active) return;

    const socket = createSocket();
    socketRef.current = socket;

    if (!navigator.geolocation) {
      setGpsError('Your browser does not support location');
      return () => socket.disconnect();
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(point);
        setGpsError('');
        socket.emit('location:update', { donationId: id, ...point });
      },
      () => setGpsError('Allow location access so the donor and NGO can track you.'),
      { enableHighAccuracy: true }
    );

    // cleanup when leaving the page or when delivery finishes
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [active, id]);

  // Pickup OTP (from donor) or delivery OTP (from NGO)
  const submitOtp = async (e) => {
    e.preventDefault();
    setError('');
    const step = task.status === 'assigned' ? 'pickup' : 'deliver';
    try {
      const res = await api.patch(`/donations/${id}/${step}`, { otp });
      setTask({ ...task, status: res.data.status }); // keep populated donor/ngo info
      setOtp('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error && !task) return <p className="error">{error}</p>;
  if (!task) return <p className="muted">Loading...</p>;

  const pickup = toLatLng(task.location);
  const drop = task.ngo.location;
  const nextStop = task.status === 'assigned' ? pickup : drop;

  return (
    <>
      <Link to="/delivery" className="muted small">← Back to my deliveries</Link>
      <div className="page-header">
        <h1>{task.title}</h1>
        <StatusBadge status={task.status} />
      </div>

      <div className="task-layout">
        <div>
          <RouteMap pickup={pickup} drop={drop} live={myLocation} status={task.status} />
          {active && myLocation && <p className="success small">🟢 Sharing your live location</p>}
          {active && gpsError && <p className="error small">{gpsError}</p>}
        </div>

        <div className="card">
          <FoodInfo donation={task} showExpiry={false} />

          <div className={`stop ${task.status === 'assigned' ? 'stop-current' : 'stop-done'}`}>
            <strong>1. Pickup from {task.donor.name}</strong>
            <span>{task.pickupAddress}</span>
            <a href={`tel:${task.donor.phone}`}>📞 {task.donor.phone}</a>
          </div>
          <div className={`stop ${task.status === 'picked_up' ? 'stop-current' : task.status === 'delivered' ? 'stop-done' : ''}`}>
            <strong>2. Drop at {task.ngo.name}</strong>
            <span>{task.ngo.address}</span>
            <a href={`tel:${task.ngo.phone}`}>📞 {task.ngo.phone}</a>
          </div>

          {active && (
            <>
              <a href={googleMapsLink(nextStop)} target="_blank" rel="noreferrer" className="btn btn-outline btn-block">
                🧭 Navigate in Google Maps
              </a>

              <form onSubmit={submitOtp} className="form otp-form">
                <label>
                  {task.status === 'assigned' ? 'Pickup OTP (ask the donor)' : 'Delivery OTP (ask the NGO)'}
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} placeholder="4 digit OTP" required />
                </label>
                {error && <p className="error">{error}</p>}
                <button className="btn btn-block">
                  {task.status === 'assigned' ? 'Confirm pickup' : 'Confirm delivery'}
                </button>
              </form>
            </>
          )}

          {task.status === 'delivered' && <p className="success">✅ Delivered! Thank you for helping fight hunger.</p>}
        </div>
      </div>
    </>
  );
}
