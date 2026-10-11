import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackDonation from './pages/TrackDonation';
import DonorDashboard from './pages/donor/DonorDashboard';
import AddDonation from './pages/donor/AddDonation';
import NgoDashboard from './pages/ngo/NgoDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryTask from './pages/delivery/DeliveryTask';
import AdminDashboard from './pages/admin/AdminDashboard';

// All pages of the app. ProtectedRoute decides who can open which page.
export default function App() {
  return (
    <>
      <Navbar />
      <main className="container page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Donor */}
          <Route path="/donor" element={<ProtectedRoute roles={['donor']}><DonorDashboard /></ProtectedRoute>} />
          <Route path="/donor/new" element={<ProtectedRoute roles={['donor']}><AddDonation /></ProtectedRoute>} />

          {/* NGO */}
          <Route path="/ngo" element={<ProtectedRoute roles={['ngo']}><NgoDashboard /></ProtectedRoute>} />

          {/* Delivery */}
          <Route path="/delivery" element={<ProtectedRoute roles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/delivery/task/:id" element={<ProtectedRoute roles={['delivery']}><DeliveryTask /></ProtectedRoute>} />

          {/* Live tracking for donor, NGO and admin */}
          <Route path="/track/:id" element={<ProtectedRoute roles={['donor', 'ngo', 'admin']}><TrackDonation /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
