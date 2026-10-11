// Coloured label for a donation status (colours are in index.css: .status-available, ...)
const LABELS = {
  available: 'Available',
  claimed: 'Claimed by NGO',
  assigned: 'Delivery assigned',
  picked_up: 'On the way',
  delivered: 'Delivered',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{LABELS[status] || status}</span>;
}
