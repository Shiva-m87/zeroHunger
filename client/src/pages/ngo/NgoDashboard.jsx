import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import NearbyFood from './NearbyFood';
import MyClaims from './MyClaims';
import DeliveryStaff from './DeliveryStaff';

// NGO home page with 3 tabs. Each tab is its own component in this folder.
export default function NgoDashboard() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('nearby');
  const [staff, setStaff] = useState([]); // delivery people (needed in 2 tabs)

  const loadStaff = () => api.get('/ngo/staff').then((res) => setStaff(res.data));

  useEffect(() => {
    // Reload our profile in case the admin verified us since we logged in
    api.get('/auth/me').then((res) => setUser(res.data));
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{user.name}</h1>
          <p className="muted">📍 {user.address}</p>
        </div>
        {user.isVerified ? <span className="badge status-delivered">✔ Verified NGO</span> : <span className="badge status-expired">Pending verification</span>}
      </div>

      {!user.isVerified && (
        <p className="notice">
          Your NGO is waiting for admin verification. You can add delivery staff now, and claim food once verified.
        </p>
      )}

      <div className="tabs">
        <button className={tab === 'nearby' ? 'active' : ''} onClick={() => setTab('nearby')}>🍱 Available food</button>
        <button className={tab === 'claims' ? 'active' : ''} onClick={() => setTab('claims')}>📦 My claims</button>
        <button className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>🛵 Delivery staff ({staff.length})</button>
      </div>

      {tab === 'nearby' && <NearbyFood onClaimed={() => setTab('claims')} />}
      {tab === 'claims' && <MyClaims staff={staff} goToStaff={() => setTab('staff')} />}
      {tab === 'staff' && <DeliveryStaff staff={staff} reloadStaff={loadStaff} />}
    </>
  );
}
