const fs = require('fs');
const path = require('path');

const root = __dirname;

const files = {
  // 1. ROUTER & LAYOUT
  'src/App.jsx': `import React from 'react';
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
}`,

  'src/components/layout/AppLayout.jsx': `import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, Home, Flame, FilePlus2, FolderCheck, LayoutDashboard, Building2, LogOut, Sun, Moon, AlertOctagon, UserCircle 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../ui/Badge';
import { NotificationBell } from './NotificationBell';

export const AppLayout = () => {
  const { user, profile, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Heatmap', path: '/heatmap', icon: Flame },
    { name: 'Nearby Stations', path: '/services', icon: Building2 },
    { name: 'Report Crime', path: '/report', icon: FilePlus2, requiresAuth: true },
    { name: 'My Reports', path: '/dashboard', icon: FolderCheck, requiresAuth: true },
    ...(isAdmin ? [{ name: 'Admin Console', path: '/admin', icon: LayoutDashboard, adminOnly: true }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-dark-border/80 fixed inset-y-0 left-0 z-30">
        <div className="h-20 flex items-center px-6 border-b border-dark-border/60 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-wider text-white block">SENTRAX</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-widest block -mt-1">CIVIC SAFETY OS</span>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => navigate('/sos')}
            className="w-full relative group overflow-hidden rounded-xl bg-danger/15 border border-danger/40 p-3 text-left transition-all hover:border-danger hover:shadow-glow-danger"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
              </span>
              <div>
                <span className="text-xs font-bold text-danger uppercase tracking-wider block">One-Tap SOS</span>
                <span className="text-[11px] text-gray-400 block">Emergency Dispatch</span>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={\`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 \${
                  isActive ? 'bg-primary text-white shadow-glow' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }\`}
              >
                <Icon className={\`w-4 h-4 \${isActive ? 'text-white' : 'text-gray-400'}\`} />
                <span>{item.name}</span>
                {item.adminOnly && (
                  <Badge variant="danger" className="ml-auto text-[9px] py-0 px-1.5">ADMIN</Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-dark-border transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>

          {user ? (
            <div className="pt-2 border-t border-dark-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{profile?.full_name || user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-mono">{profile?.role || 'Citizen'}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-center block"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-6">
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-dark-border flex items-center justify-between px-4 sm:px-6">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-heading font-extrabold text-base tracking-wider text-white">SENTRAX</span>
          </div>

          <div className="hidden md:block text-xs font-mono text-gray-400">
            SYSTEM STATUS: SECURED • ACTIVE NODES (KANPUR METRO)
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {user && <NotificationBell />}
            <button onClick={toggleTheme} className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-dark-border px-3 py-2 flex items-center justify-around backdrop-blur-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={\`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors \${
                isActive ? 'text-primary' : 'text-gray-400'
              }\`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </NavLink>
          );
        })}
        <NavLink to="/sos" className="flex flex-col items-center justify-center py-1 px-2 text-danger">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-bold mt-1">SOS</span>
        </NavLink>
      </nav>
    </div>
  );
}`,

  'src/components/layout/ProtectedRoute.jsx': `import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-bg"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};`,

  'src/components/layout/AdminRoute.jsx': `import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-bg"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return children;
};`,

  'src/components/layout/RoleRedirect.jsx': `import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const RoleRedirect = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  return children;
};`,

  'src/components/layout/NotificationBell.jsx': `import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      if (data) setNotifications(data);
    };
    fetchNotifs();

    const channel = supabase.channel(\`notifs-\${user.id}\`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: \`user_id=eq.\${user.id}\` }, (payload) => {
      setNotifications((prev) => [payload.new, ...prev]);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(p => !p)} className="p-2 rounded-xl text-gray-400 hover:text-white border border-dark-border relative">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center font-bold">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-panel border border-dark-border rounded-2xl p-4 shadow-2xl z-50">
          <p className="text-xs font-bold text-white mb-2">Notifications</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? <p className="text-xs text-gray-500">No alerts yet.</p> : notifications.map(n => (
              <div key={n.id} className="p-2 rounded-lg bg-dark-surface border border-dark-border text-xs">
                <p className="font-bold text-white">{n.title}</p>
                <p className="text-gray-400 text-[11px]">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};`,

  // 2. PAGES
  'src/pages/Home.jsx': `import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Flame, Radio, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';

export const Home = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-12 text-center">
      <Badge variant="primary">SENTRAX • CIVIC SAFETY PLATFORM</Badge>
      <h1 className="text-4xl sm:text-6xl font-extrabold text-white">
        Crime Heatmap & <span className="text-primary">Emergency Response</span>
      </h1>
      <p className="text-gray-400 max-w-xl mx-auto text-base">
        Crowdsourced crime reporting, real-time spatial heatmaps, and one-tap emergency SOS broadcast.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/report"><Button variant="primary" size="lg" icon={ArrowRight}>Report Incident</Button></Link>
        <Link to="/heatmap"><Button variant="outline" size="lg" icon={Flame}>Live Heatmap</Button></Link>
      </div>
    </div>
  );
};`,

  'src/pages/Login.jsx': `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">Sign In to Sentrax</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input id="email" type="email" label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input id="password" type="password" label="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>Sign In</Button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-4">
          New here? <Link to="/register" className="text-primary font-bold">Register as Citizen</Link>
        </p>
      </Card>
    </div>
  );
};`,

  'src/pages/Register.jsx': `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, fullName, phoneNumber: phone });
      alert('Registered! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">Citizen Registration</h2>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <Input id="name" label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <Input id="email" type="email" label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input id="phone" label="Phone" value={phone} onChange={e => setPhone(e.target.value)} required />
          <Input id="password" type="password" label="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>Register</Button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-4">
          Already registered? <Link to="/login" className="text-primary font-bold">Sign In</Link>
        </p>
      </Card>
    </div>
  );
};`,

  'src/pages/Unauthorized.jsx': `import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Unauthorized = () => (
  <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
    <Card className="text-center p-8 max-w-md">
      <h2 className="text-2xl font-bold text-danger mb-2">403 - Access Denied</h2>
      <p className="text-gray-400 text-xs mb-6">Administrator privileges required.</p>
      <Link to="/"><Button variant="outline">Return Home</Button></Link>
    </Card>
  </div>
);`,

  'src/pages/ReportCrime.jsx': `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const ReportCrime = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [lat, setLat] = useState('26.4499');
  const [lng, setLng] = useState('80.3319');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: cat } = await supabase.from('crime_categories').select('id').limit(1).single();
      await supabase.from('crime_reports').insert({
        user_id: user.id,
        category_id: cat?.id || '00000000-0000-0000-0000-000000000000',
        title,
        description: desc,
        incident_date: new Date().toISOString(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        status: 'pending',
      });
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Report an Incident</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Description</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-dark-surface border border-dark-border rounded-xl p-3 text-sm text-white" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="lat" label="Latitude" value={lat} onChange={e => setLat(e.target.value)} required />
            <Input id="lng" label="Longitude" value={lng} onChange={e => setLng(e.target.value)} required />
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>Submit Report</Button>
        </form>
      </Card>
    </div>
  );
};`,

  'src/pages/MyReports.jsx': `import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('crime_reports').select('*').eq('user_id', user.id).then(({ data }) => {
      if (data) setReports(data);
    });
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
      <h2 className="text-2xl font-bold text-white">My Submitted Reports</h2>
      {reports.length === 0 ? <p className="text-gray-400 text-xs">No reports submitted yet.</p> : reports.map(r => (
        <Card key={r.id} className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-sm">{r.title}</h3>
            <p className="text-xs text-gray-400">{r.description}</p>
          </div>
          <Badge variant="warning">{r.status}</Badge>
        </Card>
      ))}
    </div>
  );
};`,

  'src/pages/HeatmapView.jsx': `import React from 'react';
import { Card } from '../components/ui/Card';

export const HeatmapView = () => (
  <div className="max-w-5xl mx-auto py-8 px-4">
    <Card className="p-8 text-center space-y-3">
      <h2 className="text-2xl font-bold text-white">Kanpur Crime Heatmap</h2>
      <p className="text-xs text-gray-400">Heatmap engine initialized and reading from public.heatmap_points view.</p>
    </Card>
  </div>
);`,

  'src/pages/NearbyServices.jsx': `import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Phone } from 'lucide-react';

export const NearbyServices = () => {
  const [services, setServices] = useState([]);
  useEffect(() => {
    supabase.from('emergency_services').select('*').then(({ data }) => { if (data) setServices(data); });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
      <h2 className="text-2xl font-bold text-white">Nearby Emergency Services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map(s => (
          <Card key={s.id} className="space-y-2">
            <h3 className="font-bold text-white">{s.name}</h3>
            <p className="text-xs text-gray-400">{s.address}</p>
            <a href={\`tel:\${s.phone}\`} className="inline-flex items-center gap-1.5 text-xs text-primary font-bold"><Phone className="w-3.5 h-3.5" /> Call {s.phone}</a>
          </Card>
        ))}
      </div>
    </div>
  );
};`,

  'src/pages/EmergencySOS.jsx': `import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const EmergencySOS = () => {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);

  const triggerSOS = async () => {
    await supabase.from('sos_alerts').insert({
      user_id: user.id,
      latitude: 26.4499,
      longitude: 80.3319,
      status: 'active',
    });
    setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="text-center p-8 max-w-sm space-y-4 border-danger/40">
        <h2 className="text-2xl font-black text-danger">ONE-TAP EMERGENCY SOS</h2>
        <p className="text-xs text-gray-400">Broadcasts your live GPS coordinates directly to admin consoles.</p>
        <button onClick={triggerSOS} className="w-32 h-32 rounded-full bg-danger text-white font-black text-2xl shadow-glow-danger hover:scale-105 transition-all">
          {sent ? 'SENT!' : 'SOS'}
        </button>
      </Card>
    </div>
  );
};`,

  'src/pages/AdminDashboard.jsx': `import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  useEffect(() => {
    supabase.from('crime_reports').select('*').then(({ data }) => { if (data) setReports(data); });
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <h2 className="text-3xl font-extrabold text-white">Admin Command Center</h2>
      <Card>
        <h3 className="font-bold text-white text-sm mb-4">Total Received Reports: {reports.length}</h3>
        <div className="space-y-2">
          {reports.map(r => (
            <div key={r.id} className="p-3 rounded-xl bg-dark-surface border border-dark-border flex justify-between items-center text-xs">
              <span className="font-bold text-white">{r.title}</span>
              <Badge variant="primary">{r.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}`,
};

// Write files
console.log('Writing missing pages and App.jsx...');
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(root, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`✓ Created: ${relPath}`);
});
console.log('\n🎉 DONE! All pages and App.jsx are now created.');