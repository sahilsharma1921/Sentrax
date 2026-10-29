import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const RoleRedirect = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  return children;
};