import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import { RoleRedirect } from './components/layout/RoleRedirect';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Unauthorized } from './pages/Unauthorized';
import { ReportCrime } from './pages/ReportCrime';
import { MyReports } from './pages/MyReports';
import { HeatmapView } from './pages/HeatmapView';
import { NearbyServices } from './pages/NearbyServices';
import { EmergencySOS } from './pages/EmergencySOS';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Profile';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/heatmap" element={<HeatmapView />} />
              <Route path="/services" element={<NearbyServices />} />
              
              <Route path="/login" element={<RoleRedirect><Login /></RoleRedirect>} />
              <Route path="/register" element={<RoleRedirect><Register /></RoleRedirect>} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/sos" element={<ProtectedRoute><EmergencySOS /></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute><ReportCrime /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />

              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}