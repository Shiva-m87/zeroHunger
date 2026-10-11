import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import { dashboardPath } from '../utils/format';

export default function Register() {
  const { user, saveSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams(); // "/register?role=ngo" opens the NGO tab directly

  const [role, setRole] = useState(params.get('role') === 'ngo' ? 'ngo' : 'donor');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!location) return setError('Please pick your location on the map');

    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', { ...form, role, location });
      saveSession(res.data);
      navigate(dashboardPath(role));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-box auth-box-wide card">
      <h2>Create your account</h2>

      {/* Role switcher */}
      <div className="tabs">
        <button type="button" className={role === 'donor' ? 'active' : ''} onClick={() => setRole('donor')}>
          🍱 I want to donate
        </button>
        <button type="button" className={role === 'ngo' ? 'active' : ''} onClick={() => setRole('ngo')}>
          🏢 I am an NGO
        </button>
      </div>

      {role === 'ngo' && (
        <p className="notice">An admin will verify your NGO before you can claim food.</p>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="grid grid-2">
          <label>
            {role === 'ngo' ? 'NGO name' : 'Name / Restaurant name'}
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password (min 6 characters)
            <input type="password" name="password" minLength={6} value={form.password} onChange={handleChange} required />
          </label>
        </div>

        <label>
          Address
          <input name="address" value={form.address} onChange={handleChange} required />
        </label>

        <div>
          <p className="label-text">
            {role === 'ngo' ? 'NGO location (food will be delivered here)' : 'Your location (default pickup point)'}
          </p>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="muted small center">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
