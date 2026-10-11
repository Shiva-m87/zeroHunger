import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import StatusBadge from '../../components/StatusBadge';
import FoodInfo from '../../components/FoodInfo';
import useLiveRefresh from '../../utils/useLiveRefresh';
import { formatDateTime, isActiveDelivery } from '../../utils/format';

// Delivery person's home page: active tasks on top, finished ones below
export default function DeliveryDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = () =>
    api
      .get('/donations/tasks')
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadTasks();
  }, []);
  useLiveRefresh(loadTasks); // new assignments appear automatically

  const active = tasks.filter((t) => isActiveDelivery(t.status));
  const completed = tasks.filter((t) => t.status === 'delivered');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My deliveries</h1>
          <p className="muted">
            {active.length} active · {completed.length} completed
          </p>
        </div>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {!loading && active.length === 0 && <div className="card empty">No active deliveries. New tasks from your NGO will appear here.</div>}

      <div className="grid grid-2">
        {active.map((t) => (
          <div className="card" key={t._id}>
            <div className="card-head">
              <h3>{t.title}</h3>
              <StatusBadge status={t.status} />
            </div>
            <FoodInfo donation={t} showExpiry={false} />
            <p className="small">
              <strong>Pickup:</strong> {t.donor?.name} · {t.pickupAddress}
              <br />
              <strong>Drop:</strong> {t.ngo?.name} · {t.ngo?.address}
            </p>
            <div className="card-actions">
              <Link to={`/delivery/task/${t._id}`} className="btn btn-sm">
                {t.status === 'assigned' ? 'Start pickup →' : 'Continue delivery →'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {completed.length > 0 && (
        <>
          <h2 className="section-title">Completed</h2>
          <ul className="list card">
            {completed.map((t) => (
              <li key={t._id}>
                <strong>✅ {t.title}</strong>
                <span className="muted small">
                  {t.quantity} {t.unit} · {t.donor?.name} → {t.ngo?.name} · {formatDateTime(t.deliveredAt)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
