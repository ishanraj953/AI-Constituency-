import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Landing & Informational Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FaqPage from './pages/FaqPage';
import PublicTrackingPage from './pages/PublicTrackingPage';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Citizen, Staff & Admin Interactive Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import ComplaintManagement from './pages/ComplaintManagement';
import CitizenTracking from './pages/CitizenTracking';
import UserDashboard from './pages/UserDashboard';
import StaffDashboard from './pages/StaffDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>

            {/* Public Showcase & Informational Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/track" element={<PublicTrackingPage />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* User & Citizen Authenticated Routes */}
            <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN', 'STAFF']} />}>
              <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/submit" element={<Home />} />
              <Route path="/user/tracking" element={<CitizenTracking />} />
            </Route>

            {/* Staff / Department Officer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
              <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
            </Route>

            {/* Command Center & Regional Analytics (Accessible to Municipal Admin & Department Staff) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/analytics" element={<Analytics />} />
            </Route>

            {/* Admin-Only Grievance Redressal & Assignment Management */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/complaints" element={<ComplaintManagement />} />
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}