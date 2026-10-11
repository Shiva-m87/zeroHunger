import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/format';

const STEPS = [
  { icon: '🍱', title: 'Donor lists food', text: 'Restaurants, events and homes add surplus food with quantity, type and expiry time.' },
  { icon: '🏢', title: 'Nearby NGO claims it', text: 'Verified NGOs see food near them, most urgent first, and claim it in one click.' },
  { icon: '🛵', title: 'NGO delivery picks up', text: 'The NGO assigns its delivery person, who gets the shortest route to pickup and drop.' },
  { icon: '📍', title: 'Live tracking & OTP', text: 'Everyone tracks the delivery live. OTPs at pickup and drop confirm the hand-over.' },
];

export default function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  return (
    <>
      <section className="hero">
        <p className="eyebrow">UN Sustainable Development Goal 2 · Zero Hunger</p>
        <h1>Surplus food should feed people, not bins.</h1>
        <p className="hero-text">
          ZeroHunger connects people who have extra food with NGOs who can serve it — before it goes bad.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-lg">Donate food</Link>
          <Link to="/register?role=ngo" className="btn btn-outline btn-lg">Register your NGO</Link>
        </div>
      </section>

      <h2 className="section-title">How it works</h2>
      <div className="grid grid-4">
        {STEPS.map((step, i) => (
          <div className="card step" key={step.title}>
            <div className="step-icon">{step.icon}</div>
            <h3>
              {i + 1}. {step.title}
            </h3>
            <p className="muted">{step.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
