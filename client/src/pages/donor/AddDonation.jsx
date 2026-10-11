import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import { useAuth } from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';

// How long the food stays safe - easier for users than picking an exact date/time
const SAFE_HOURS = [1, 2, 3, 4, 6, 8, 12, 24, 48, 72];

export default function AddDonation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    category: 'cooked',
    foodType: 'veg',
    quantity: '',
    unit: 'servings',
    safeHours: 4,
    notes: '',
    pickupAddress: user.address || '',
  });
  // Pickup location starts at the donor's saved location; they can change it on the map
  const [location, setLocation] = useState(user.location?.lat != null ? user.location : null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!location) return setError('Please pick the pickup location on the map');

    setSubmitting(true);
    try {
      const { safeHours, ...food } = form;
      await api.post('/donations', {
        ...food,
        quantity: Number(form.quantity),
        expiresAt: new Date(Date.now() + safeHours * 60 * 60 * 1000), // now + selected hours
        lat: location.lat,
        lng: location.lng,
      });
      navigate('/donor');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card form-card">
      <h1>Donate food</h1>
      <p className="muted">Nearby NGOs will be notified instantly.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          What food is it?
          <input name="title" placeholder="e.g. Veg biryani, bread packets" value={form.title} onChange={handleChange} required />
        </label>

        <div className="grid grid-2">
          <label>
            Category
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="cooked">Cooked meal</option>
              <option value="raw">Raw ingredients</option>
              <option value="packaged">Packaged food</option>
            </select>
          </label>
          <label>
            Type
            <select name="foodType" value={form.foodType} onChange={handleChange}>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-veg</option>
            </select>
          </label>
          <label>
            Quantity
            <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} required />
          </label>
          <label>
            Unit
            <select name="unit" value={form.unit} onChange={handleChange}>
              <option value="servings">Servings (people)</option>
              <option value="kg">Kg</option>
              <option value="packets">Packets</option>
            </select>
          </label>
        </div>

        <label>
          Safe to eat for the next
          <select name="safeHours" value={form.safeHours} onChange={handleChange}>
            {SAFE_HOURS.map((h) => (
              <option key={h} value={h}>
                {h} {h === 1 ? 'hour' : 'hours'}
              </option>
            ))}
          </select>
        </label>

        <label>
          Notes (optional)
          <textarea name="notes" rows="2" placeholder="Allergens, packaging, special instructions..." value={form.notes} onChange={handleChange} />
        </label>

        <label>
          Pickup address
          <input name="pickupAddress" value={form.pickupAddress} onChange={handleChange} required />
        </label>

        <div>
          <p className="label-text">Pickup location</p>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post donation'}
        </button>
      </form>
    </div>
  );
}
