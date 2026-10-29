import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-bg"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};