import { formatDateTime, timeLeft } from '../utils/format';

// The food "metadata" block shown on every donation card
export default function FoodInfo({ donation, showExpiry = true }) {
  return (
    <>
      <div className="tags">
        <span className={`tag ${donation.foodType === 'veg' ? 'tag-veg' : 'tag-nonveg'}`}>
          {donation.foodType === 'veg' ? '● Veg' : '● Non-veg'}
        </span>
        <span className="tag">{donation.category}</span>
        <span className="tag">
          {donation.quantity} {donation.unit}
        </span>
      </div>
      {showExpiry && (
        <p className="muted small">
          ⏰ Safe till {formatDateTime(donation.expiresAt)} ({timeLeft(donation.expiresAt)})
        </p>
      )}
      {donation.notes && <p className="small">📝 {donation.notes}</p>}
    </>
  );
}
