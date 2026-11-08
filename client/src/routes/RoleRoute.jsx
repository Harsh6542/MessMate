import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    const getDashboardPath = (role) => {
      switch (role) {
        case 'mess_staff':
          return '/staff/dashboard';
        case 'mess_manager':
          return '/manager/dashboard';
        case 'admin':
          return '/admin/dashboard';
        default:
          return '/student/dashboard';
      }
    };
    // Redirect to user's authorized home dashboard based on role
    const fallbackPath = user ? getDashboardPath(user.role) : '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

