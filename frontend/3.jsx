import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const RequireAuth = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const HostOnlyRoute = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'host') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const TravelerOnlyRoute = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'traveler') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
