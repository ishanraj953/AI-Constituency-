import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || 'USER').toUpperCase();

  if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
    if (userRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    } else {
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return <Outlet />;
};

