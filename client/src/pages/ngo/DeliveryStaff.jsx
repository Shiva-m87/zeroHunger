import { useState } from 'react';
import api, { getErrorMessage } from '../../api';

const EMPTY_FORM = { name: '', phone: '', email: '', password: '' };

// Tab 3: NGO creates logins for its own delivery people
export default function DeliveryStaff({ staff, reloadStaff }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/ngo/staff', form);
      setMessage(`Account created. ${form.name} can now log in with ${form.email}`);
      setForm(EMPTY_FORM);
      reloadStaff();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Add delivery person</h3>
        <form onSubmit={handleSubmit} className="form">
          <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={handleChange} required /></label>
          <label>Login email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
          <label>
            Password (min 6 characters)
            <input type="password" name="password" minLength={6} value={form.password} onChange={handleChange} required />
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button className="btn">Create account</button>
        </form>
      </div>

      <div className="card">
        <h3>Your team</h3>
        {staff.length === 0 && <p className="muted">No delivery staff yet.</p>}
        <ul className="list">
          {staff.map((s) => (
            <li key={s._id}>
              <strong>🛵 {s.name}</strong>
              <span className="muted small">{s.phone} · {s.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
