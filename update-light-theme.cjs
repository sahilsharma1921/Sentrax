const fs = require('fs');
const path = require('path');

const root = __dirname;
console.log('🎨 Upgrading SENTRAX Light Mode UI & Readability System...');

const updates = {
  // 1. TAILWIND CONFIGURATION WITH LIGHT THEME TOKENS
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0B10',
          surface: '#12141C',
          surfaceHover: '#181B26',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        light: {
          bg: '#F3F5FA',
          surface: '#FFFFFF',
          surfaceHover: '#F8FAFC',
          border: '#E1E5EE',
          text: '#172033',
          muted: '#596579',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: 'rgba(99, 102, 241, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: 'rgba(239, 68, 68, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: 'rgba(245, 158, 11, 0.15)',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: 'rgba(16, 185, 129, 0.15)',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-danger': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'panel': '0 4px 20px -2px rgba(23, 32, 51, 0.05), 0 2px 6px -1px rgba(23, 32, 51, 0.03)',
      },
    },
  },
  plugins: [],
};
`,

  // 2. GLOBAL CSS WITH LIGHT BACKGROUND (#F3F5FA) & HIGH-CONTRAST TOKENS
  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    overflow-x: hidden;
    @apply bg-[#F3F5FA] text-[#172033] dark:bg-dark-bg dark:text-gray-100;
    font-family: theme('fontFamily.body');
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: theme('fontFamily.heading');
    @apply text-[#172033] dark:text-white;
  }
  p {
    @apply text-[#596579] dark:text-gray-400;
  }
}

/* Glass panel default for Light Mode (#FFFFFF Surface + #E1E5EE Border) */
.glass-panel {
  background: #FFFFFF;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid #E1E5EE;
  box-shadow: 0 4px 20px -2px rgba(23, 32, 51, 0.05), 0 2px 6px -1px rgba(23, 32, 51, 0.03);
}

/* Glass panel override for Dark Mode */
.dark .glass-panel {
  background: rgba(18, 20, 28, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}
`,

  // 3. UI BUTTON: HIGH CONTRAST OUTLINE, SECONDARY, & GHOST VARIANTS
  'src/components/ui/Button.jsx': `import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[50px]',
  };
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-glow focus:ring-primary',
    danger: 'bg-danger text-white hover:bg-danger-hover shadow-glow-danger focus:ring-danger',
    outline: 'border border-[#E1E5EE] dark:border-dark-border text-[#172033] dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 focus:ring-primary shadow-sm dark:shadow-none',
    secondary: 'bg-white dark:bg-dark-surface text-[#172033] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-surfaceHover border border-[#E1E5EE] dark:border-dark-border shadow-sm',
    ghost: 'text-[#596579] dark:text-gray-400 hover:text-[#172033] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={base + ' ' + sizes[size] + ' ' + variants[variant] + ' ' + className}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      <span>{children}</span>
    </button>
  );
};
`,

  // 4. UI INPUT: READABLE LABELS, BORDERS & PLACEHOLDERS
  'src/components/ui/Input.jsx': `import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-gray-300">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#596579] dark:text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={'w-full rounded-xl bg-white dark:bg-dark-surface text-[#172033] dark:text-gray-100 placeholder:text-[#596579]/60 dark:placeholder:text-gray-500 border border-[#E1E5EE] dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
            (error ? 'border-danger focus:ring-danger ' : '') +
            (Icon ? 'pl-10 ' : 'pl-3.5 ') +
            'pr-4 py-2.5 text-sm transition-colors focus:outline-none ' + className}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  );
};
`,

  // 5. UI BADGE: HIGH CONTRAST IN BOTH LIGHT & DARK MODES
  'src/components/ui/Badge.jsx': `import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-white/10',
    primary: 'bg-indigo-50 dark:bg-primary/15 text-indigo-700 dark:text-primary-hover border-indigo-200 dark:border-primary/30',
    danger: 'bg-red-50 dark:bg-danger/15 text-red-700 dark:text-danger border-red-200 dark:border-danger/30',
    warning: 'bg-amber-50 dark:bg-warning/15 text-amber-800 dark:text-warning border-amber-200 dark:border-warning/30',
    success: 'bg-emerald-50 dark:bg-success/15 text-emerald-800 dark:text-success border-emerald-200 dark:border-success/30',
    info: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  };

  return (
    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono tracking-tight ' + styles[variant] + ' ' + className}>
      {children}
    </span>
  );
};
`,

  // 6. UI MODAL: HIGH CONTRAST HEADINGS & CLOSE BUTTON
  'src/components/ui/Modal.jsx': `import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className={'relative w-full ' + maxWidth + ' glass-panel border border-[#E1E5EE] dark:border-dark-border rounded-2xl shadow-2xl p-6 z-10'}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E1E5EE] dark:border-dark-border mb-4">
              <h3 className="text-lg font-bold text-[#172033] dark:text-white tracking-wide">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg text-[#596579] hover:text-[#172033] dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
`,

  // 7. APP LAYOUT: HIGH CONTRAST SIDEBAR, HEADER & PROFILE LINK
  'src/components/layout/AppLayout.jsx': `import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
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
    <div className="min-h-screen flex bg-[#F3F5FA] dark:bg-dark-bg text-[#172033] dark:text-gray-100 transition-colors duration-200">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-[#E1E5EE] dark:border-dark-border/80 fixed inset-y-0 left-0 z-30">
        <div className="h-20 flex items-center px-6 border-b border-[#E1E5EE] dark:border-dark-border/60 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-glow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-wider text-[#172033] dark:text-white block">SENTRAX</span>
            <span className="text-[10px] text-[#596579] dark:text-gray-400 font-mono tracking-widest block -mt-1 font-bold">CIVIC SAFETY OS</span>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => navigate('/sos')}
            className="w-full relative group overflow-hidden rounded-xl bg-danger/10 dark:bg-danger/15 border border-danger/30 hover:border-danger p-3 text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
              </span>
              <div>
                <span className="text-xs font-bold text-danger uppercase tracking-wider block">One-Tap SOS</span>
                <span className="text-[11px] text-[#596579] dark:text-gray-400 block font-medium">Emergency Dispatch</span>
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
                className={'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ' + (
                  isActive 
                    ? 'bg-primary text-white shadow-glow' 
                    : 'text-[#596579] dark:text-gray-400 hover:text-[#172033] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <Icon className={'w-4 h-4 ' + (isActive ? 'text-white' : 'text-[#596579] dark:text-gray-400')} />
                <span>{item.name}</span>
                {item.adminOnly && (
                  <Badge variant="danger" className="ml-auto text-[9px] py-0 px-1.5">ADMIN</Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-[#E1E5EE] dark:border-dark-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#596579] dark:text-gray-400">Appearance</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#596579] dark:text-gray-400 hover:text-[#172033] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-[#E1E5EE] dark:border-dark-border transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

          {user ? (
            <div className="pt-2 border-t border-[#E1E5EE] dark:border-dark-border/40 flex items-center justify-between">
              <Link 
                to="/profile" 
                className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-85 transition-opacity"
                title="Open Profile Dashboard"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-[#172033] dark:text-white truncate group-hover:text-primary transition-colors">
                    {profile?.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-[#596579] dark:text-gray-400 uppercase font-mono font-bold">
                    {profile?.role || 'Citizen'}
                  </p>
                </div>
              </Link>

              <button 
                onClick={handleLogout} 
                className="p-1.5 rounded-lg text-[#596579] hover:text-danger hover:bg-danger/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover shadow-glow transition-all text-center block"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-6">
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-[#E1E5EE] dark:border-dark-border flex items-center justify-between px-4 sm:px-6">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-heading font-extrabold text-base tracking-wider text-[#172033] dark:text-white">SENTRAX</span>
          </div>

          <div className="hidden md:block text-xs font-mono font-bold text-[#596579] dark:text-gray-400">
            SYSTEM STATUS: SECURED • ACTIVE NODES (KANPUR METRO)
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <>
                <NotificationBell />
                <Link to="/profile" className="md:hidden p-2 rounded-lg text-[#596579] dark:text-gray-300">
                  <UserCircle className="w-5 h-5 text-primary" />
                </Link>
              </>
            )}
            <button onClick={toggleTheme} className="md:hidden p-2 rounded-lg text-[#596579] dark:text-gray-400">
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-[#E1E5EE] dark:border-dark-border px-3 py-2 flex items-center justify-around backdrop-blur-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ' + (
                isActive ? 'text-primary' : 'text-[#596579] dark:text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">{item.name}</span>
            </NavLink>
          );
        })}
        {user && (
          <NavLink
            to="/profile"
            className={'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ' + (
              location.pathname === '/profile' ? 'text-primary' : 'text-[#596579] dark:text-gray-400'
            )}
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Profile</span>
          </NavLink>
        )}
        <NavLink to="/sos" className="flex flex-col items-center justify-center py-1 px-2 text-danger">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-black mt-1">SOS</span>
        </NavLink>
      </nav>
    </div>
  );
};
`,

  // 8. NOTIFICATION BELL WITH CLEAR TEXT & BORDERS
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
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };
    fetchNotifs();

    const channel = supabase.channel('notifs-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id }, (payload) => {
      setNotifications((prev) => [payload.new, ...prev]);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(p => !p)} 
        className="p-2 rounded-xl text-[#596579] hover:text-[#172033] dark:text-gray-400 dark:hover:text-white border border-[#E1E5EE] dark:border-dark-border hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-panel border border-[#E1E5EE] dark:border-dark-border rounded-2xl p-4 shadow-2xl z-50">
          <p className="text-xs font-bold text-[#172033] dark:text-white mb-2">Notifications</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-[#596579] dark:text-gray-400">No alerts yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-[#F3F5FA] dark:bg-dark-surface border border-[#E1E5EE] dark:border-dark-border text-xs">
                  <p className="font-bold text-[#172033] dark:text-white">{n.title}</p>
                  <p className="text-[#596579] dark:text-gray-400 text-[11px] mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
`,

  // 9. FIXED MY REPORTS: NO INVISIBLE WHITE TEXT
  'src/pages/MyReports.jsx': `import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Clock, MapPin, AlertCircle, FileText } from 'lucide-react';

export const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('crime_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReports(data);
        setLoading(false);
      });
  }, [user]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'verified': return 'primary';
      case 'resolved': return 'success';
      case 'investigating': return 'info';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#172033] dark:text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary" />
          My Submitted Reports
        </h1>
        <p className="text-xs text-[#596579] dark:text-gray-400 mt-1">
          Track investigation status and official law enforcement actions on your filed incidents
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-24 bg-white/60 dark:bg-dark-surface/60" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="text-center p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-[#596579] dark:text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-[#172033] dark:text-white">No Reports Filed Yet</h3>
          <p className="text-xs text-[#596579] dark:text-gray-400 max-w-sm mx-auto">
            You haven't reported any civic incidents. When you report a crime or safety issue, you can track its progress here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} hoverEffect className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#172033] dark:text-white text-base truncate">
                    {r.title}
                  </h3>
                  <Badge variant={getStatusVariant(r.status)} className="capitalize">
                    {r.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#596579] dark:text-gray-300 line-clamp-2">
                  {r.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#596579] dark:text-gray-400 pt-1">
                  {r.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate max-w-xs">{r.address}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#596579]" />
                    <span>{new Date(r.incident_date || r.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
`,

  // 10. ADMIN DASHBOARD: READABLE CHARTS, TABLES & STATUS CARDS
  'src/pages/AdminDashboard.jsx': `import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Volume2, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { playEmergencyAlarm } from '../lib/soundAlert';
import { useTheme } from '../hooks/useTheme';

export const AdminDashboard = () => {
  const { isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [sosList, setSosList] = useState([]);

  const loadData = async () => {
    const { data: rep } = await supabase.from('crime_reports').select('*, crime_categories(name)').order('created_at', { ascending: false });
    if (rep) setReports(rep);
    const { data: sos } = await supabase.from('sos_alerts').select('*').eq('status', 'active');
    if (sos) setSosList(sos);
  };

  useEffect(() => {
    loadData();
    const ch = supabase.channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_alerts' }, () => {
        playEmergencyAlarm();
        loadData();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const updateStatus = async (id, status) => {
    await supabase.from('crime_reports').update({ status }).eq('id', id);
    loadData();
  };

  const chartData = [
    { name: 'Pending', count: reports.filter(r => r.status === 'pending').length },
    { name: 'Verified', count: reports.filter(r => r.status === 'verified').length },
    { name: 'Resolved', count: reports.filter(r => r.status === 'resolved').length },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-3xl font-extrabold text-[#172033] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" /> Admin Command Center
          </h2>
          <p className="text-xs text-[#596579] dark:text-gray-400 mt-1">Real-time incident dispatch & verification console</p>
        </div>
        <Button variant="outline" size="sm" onClick={playEmergencyAlarm} icon={Volume2}>Test Siren</Button>
      </div>

      {sosList.length > 0 && (
        <div className="p-4 rounded-2xl bg-danger/10 border-2 border-danger text-red-700 dark:text-danger flex justify-between items-center animate-pulse">
          <span className="font-bold text-sm">🚨 ACTIVE DISTRESS SIGNALS: {sosList.length} Citizens Requesting Emergency SOS!</span>
          <Button variant="danger" size="sm" onClick={() => supabase.from('sos_alerts').update({ status: 'resolved' }).eq('status', 'active').then(() => loadData())}>Acknowledge & Resolve</Button>
        </div>
      )}

      {/* Analytics Chart */}
      <Card className="space-y-3">
        <h3 className="font-bold text-sm text-[#172033] dark:text-white uppercase tracking-wider">Reports Verification Pipeline</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#596579'} fontSize={12} />
              <YAxis stroke={isDark ? '#9CA3AF' : '#596579'} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#12141C' : '#FFFFFF', 
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E1E5EE', 
                  borderRadius: '12px', 
                  color: isDark ? '#FFFFFF' : '#172033',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }} 
              />
              <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="space-y-4">
        <h3 className="font-bold text-sm text-[#172033] dark:text-white uppercase tracking-wider">Recent Filings</h3>
        <div className="space-y-2">
          {reports.length === 0 ? (
            <p className="text-xs text-[#596579] dark:text-gray-400 py-4 text-center">No reports filed in database yet.</p>
          ) : (
            reports.map(r => (
              <div key={r.id} className="p-3.5 rounded-xl border border-[#E1E5EE] dark:border-dark-border bg-[#F3F5FA]/60 dark:bg-dark-surface/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="font-bold text-[#172033] dark:text-white text-sm">{r.title}</span>
                  <p className="text-xs text-[#596579] dark:text-gray-400 mt-0.5">{r.address || 'Kanpur Urban'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'verified' ? 'primary' : 'warning'}>{r.status}</Badge>
                  {r.status === 'pending' && <Button size="sm" variant="primary" onClick={() => updateStatus(r.id, 'verified')}>Verify</Button>}
                  {r.status === 'verified' && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'resolved')}>Mark Resolved</Button>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
`,

  // 11. HOME PAGE CONTRAST
  'src/pages/Home.jsx': `import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const Home = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-12 text-center">
      <Badge variant="primary">SENTRAX • CIVIC SAFETY PLATFORM</Badge>
      <h1 className="text-4xl sm:text-6xl font-extrabold text-[#172033] dark:text-white leading-tight">
        Crime Heatmap & <span className="text-primary">Emergency Response</span>
      </h1>
      <p className="text-[#596579] dark:text-gray-400 max-w-xl mx-auto text-base">
        Crowdsourced crime reporting, real-time spatial heatmaps, and one-tap emergency SOS broadcast.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/report"><Button variant="primary" size="lg" icon={ArrowRight}>Report Incident</Button></Link>
        <Link to="/heatmap"><Button variant="outline" size="lg" icon={Flame}>Live Heatmap</Button></Link>
      </div>
    </div>
  );
};
`
};

Object.entries(updates).forEach(([relPath, content]) => {
  const fullPath = path.join(root, relPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log('  ✓ Updated: ' + relPath);
});

console.log('\\n✨ Light Mode UI update complete! Run `npm run dev` to see the improvements.');