import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api';
import useLiveRefresh from '../../utils/useLiveRefresh';
import { formatDateTime } from '../../utils/format';

// Admin: platform numbers + verify NGOs
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [ngos, setNgos] = useState([]);

  const loadData = () => {
    api.get('/admin/stats').then((res) => setStats(res.data));
    api.get('/admin/ngos').then((res) => setNgos(res.data));
  };

  useEffect(loadData, []);
  useLiveRefresh(loadData);

  const setVerified = async (ngoId, isVerified) => {
    try {
      await api.patch(`/admin/ngos/${ngoId}/verify`, { isVerified });
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const pending = ngos.filter((n) => !n.isVerified).length;

  return (
    <>
      <div className="page-header">
        <h1>Admin dashboard</h1>
      </div>

      {stats && (
        <div className="grid grid-4 stats">
          <div className="card stat"><span>{stats.totalDonations}</span>Total donations</div>
          <div className="card stat"><span>{stats.delivered}</span>Delivered</div>
          <div className="card stat"><span>{stats.active}</span>In progress</div>
          <div className="card stat"><span>{stats.expired}</span>Expired</div>
          <div className="card stat"><span>{stats.donors}</span>Donors</div>
          <div className="card stat"><span>{stats.ngos}</span>NGOs</div>
          <div className="card stat"><span>{stats.deliveryStaff}</span>Delivery staff</div>
          <div className="card stat"><span>{pending}</span>NGOs pending</div>
        </div>
      )}

      <h2 className="section-title">NGO verification</h2>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>NGO</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Joined</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ngos.map((n) => (
              <tr key={n._id}>
                <td><strong>{n.name}</strong></td>
                <td className="small">{n.email}<br />{n.phone}</td>
                <td className="small">{n.address}</td>
                <td className="small">{formatDateTime(n.createdAt)}</td>
                <td>
                  {n.isVerified
                    ? <span className="badge status-delivered">Verified</span>
                    : <span className="badge status-expired">Pending</span>}
                </td>
                <td>
                  {n.isVerified ? (
                    <button className="btn btn-outline btn-sm" onClick={() => setVerified(n._id, false)}>Revoke</button>
                  ) : (
                    <button className="btn btn-sm" onClick={() => setVerified(n._id, true)}>Verify</button>
                  )}
                </td>
              </tr>
            ))}
            {ngos.length === 0 && (
              <tr><td colSpan="6" className="muted center">No NGOs registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
