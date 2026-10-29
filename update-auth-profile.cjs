const fs = require('fs');
const path = require('path');

const root = __dirname;
console.log('🚀 Updating SENTRAX Authentication & Profile Dashboard...');

const updates = {
  // 1. UPDATED AUTH CONTEXT WITH PROFILE EDITING & REFRESH
  'src/context/AuthContext.jsx': `import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: 'citizen',
  isAdmin: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Safely fetch profile from database, auto-creating a citizen profile if missing
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) return data;

      // Self-heal: If auth user exists without a profile row, insert default citizen record
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && authUser.id === userId) {
        const fallbackProfile = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          email: authUser.email,
          phone_number: authUser.user_metadata?.phone_number || null,
          role: 'citizen', // Never elevate role here
        };
        const { data: created } = await supabase
          .from('profiles')
          .insert(fallbackProfile)
          .select()
          .maybeSingle();
        return created || fallbackProfile;
      }
      return null;
    } catch (err) {
      console.warn('Profile fetch warning:', err);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const register = async ({ email, password, fullName, phoneNumber }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      return { ...data, profile: p };
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Editable profile information (Full Name & Phone Number)
  const updateProfile = async ({ fullName, phoneNumber }) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber ? phoneNumber.trim() : null,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id);
      setProfile(p);
      return p;
    }
    return null;
  };

  const role = profile?.role || 'citizen';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);`,

  // 2. BRAND NEW COMPLETE PROFILE DASHBOARD PAGE
  'src/pages/Profile.jsx': `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, Mail, Phone, Shield, ShieldCheck, Calendar, Key, Edit3, Save, X, LogOut, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Profile = () => {
  const { user, profile, isAdmin, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Sign-out confirmation modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile]);

  // Compute User Initials (e.g. Sahil Prajapati -> SP)
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleCancelEdit = () => {
    setFullName(profile?.full_name || '');
    setPhoneNumber(profile?.phone_number || '');
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ fullName, phoneNumber });
      setSuccessMsg('Profile information updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Session';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900 dark:text-white">
          Account Profile
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Manage your verified credentials, contact details, and system authorization
        </p>
      </div>

      {/* Feedback Banners */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <Card className="shadow-xl space-y-6">
        {/* Top Profile Banner with Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Initials Avatar Badge */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-heading font-black shadow-glow border-2 border-white/20">
              {getInitials(profile?.full_name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile?.full_name || 'Citizen User'}
                </h2>
                <Badge variant={isAdmin ? 'danger' : 'primary'} className="text-[10px] py-0.5 px-2">
                  {isAdmin ? 'ADMINISTRATOR' : 'VERIFIED CITIZEN'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-mono text-gray-400 mt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member Since: {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                icon={Edit3}
              >
                Edit Details
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                icon={X}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sahil Prajapati"
                  className="w-full bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-xs font-semibold text-gray-900 dark:text-white">
                  {profile?.full_name || 'Not provided'}
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Emergency Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-xs font-mono text-gray-900 dark:text-white">
                  {profile?.phone_number || 'No phone linked'}
                </div>
              )}
            </div>

            {/* Email Address (Immutable) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Email Address <span className="text-[10px] text-gray-400 font-normal">(Verified with Auth)</span>
              </label>
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-dark-surface/50 border border-gray-200 dark:border-dark-border text-xs font-mono text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span>{user?.email}</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Verified</span>
              </div>
            </div>

            {/* Account Role (Non-editable for security) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                System Authorization Role
              </label>
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-dark-surface/50 border border-gray-200 dark:border-dark-border text-xs font-mono text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span className="uppercase font-bold text-primary">{profile?.role || 'citizen'}</span>
                <span className="text-[10px] text-gray-400">Database Enforced</span>
              </div>
            </div>
          </div>

          {/* User ID Reference */}
          <div className="pt-2">
            <p className="text-[11px] font-mono text-gray-400">
              Account UUID: <span className="text-gray-500">{user?.id}</span>
            </p>
          </div>

          {/* Save Changes Button Bar */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Role Privileges Card */}
      <Card className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          {isAdmin ? <ShieldCheck className="w-4 h-4 text-danger" /> : <Shield className="w-4 h-4 text-primary" />}
          {isAdmin ? 'Administrative Authority' : 'Citizen Safety Privileges'}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {isAdmin
            ? 'You have elevated clearance to inspect crowd-sourced FIR reports, verify and project incidents onto the live heatmap, resolve SOS distress alarms, and dispatch civic notifications.'
            : 'As a verified citizen, your account allows you to file incident reports with photo evidence, monitor real-time danger/safety zones, trigger GPS emergency SOS alerts, and track your submitted complaints.'}
        </p>
      </Card>

      {/* Account Sign Out Action */}
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLogoutModalOpen(true)}
          icon={LogOut}
          className="text-danger border-danger/30 hover:bg-danger/10"
        >
          Sign Out of Sentrax
        </Button>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Sign Out"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to end your current active session? You will need to sign in again to file reports or access the console.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
              icon={LogOut}
            >
              Confirm Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};`,

  // 3. UPDATED APPLAYOUT WITH CLICKABLE SIDEBAR PROFILE & MOBILE HEADER LINK
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-gray-200 dark:border-dark-border/80 fixed inset-y-0 left-0 z-30">
        <div className="h-20 flex items-center px-6 border-b border-gray-200 dark:border-dark-border/60 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-glow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-wider text-gray-900 dark:text-white block">SENTRAX</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-widest block -mt-1 font-semibold">CIVIC SAFETY OS</span>
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
                <span className="text-[11px] text-gray-600 dark:text-gray-400 block font-medium">Emergency Dispatch</span>
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
                className={\`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 \${
                  isActive 
                    ? 'bg-primary text-white shadow-glow' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }\`}
              >
                <Icon className={\`w-4 h-4 \${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}\`} />
                <span>{item.name}</span>
                {item.adminOnly && (
                  <Badge variant="danger" className="ml-auto text-[9px] py-0 px-1.5">ADMIN</Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER WITH CLICKABLE PROFILE */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Appearance</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-gray-200 dark:border-dark-border transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

          {user ? (
            <div className="pt-2 border-t border-gray-200 dark:border-dark-border/40 flex items-center justify-between">
              {/* CLICKABLE PROFILE NAVIGATION LINK */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-85 transition-opacity"
                title="Open Profile Dashboard"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {profile?.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-mono">
                    {profile?.role || 'Citizen'}
                  </p>
                </div>
              </Link>

              <button 
                onClick={handleLogout} 
                className="p-1.5 rounded-lg text-gray-500 hover:text-danger hover:bg-danger/10 transition-colors"
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
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-4 sm:px-6">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-heading font-extrabold text-base tracking-wider text-gray-900 dark:text-white">SENTRAX</span>
          </div>

          <div className="hidden md:block text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
            SYSTEM STATUS: SECURED • ACTIVE NODES (KANPUR METRO)
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <>
                <NotificationBell />
                {/* Mobile top profile icon */}
                <Link to="/profile" className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300">
                  <UserCircle className="w-5 h-5 text-primary" />
                </Link>
              </>
            )}
            <button onClick={toggleTheme} className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400">
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-gray-200 dark:border-dark-border px-3 py-2 flex items-center justify-around backdrop-blur-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={\`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors \${
                isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              }\`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </NavLink>
          );
        })}
        {user && (
          <NavLink
            to="/profile"
            className={\`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors \${
              location.pathname === '/profile' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
            }\`}
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </NavLink>
        )}
        <NavLink to="/sos" className="flex flex-col items-center justify-center py-1 px-2 text-danger">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-bold mt-1">SOS</span>
        </NavLink>
      </nav>
    </div>
  );
};`,

  // 4. UPDATED LOGIN WITH ROLE-BASED REDIRECTION & INLINE VALIDATION
  'src/pages/Login.jsx': `import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      
      // Verified role-based redirect
      const userRole = result?.profile?.role || 'citizen';
      const redirectPath = location.state?.from?.pathname || (userRole === 'admin' ? '/admin' : '/dashboard');
      
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Sign In to Sentrax</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter credentials to access the safety platform</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            id="email" 
            type="email" 
            label="Email Address" 
            placeholder="citizen@sentrax.org" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            icon={Mail} 
            required 
          />
          <Input 
            id="password" 
            type="password" 
            label="Password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            icon={Lock} 
            required 
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-2" 
            isLoading={loading}
            icon={ArrowRight}
          >
            Sign In
          </Button>
        </form>

        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
          New here? <Link to="/register" className="text-primary font-bold hover:underline">Register as Citizen</Link>
        </p>
      </Card>
    </div>
  );
};`,

  // 5. UPDATED REGISTER PAGE WITH CLEAN VALIDATION
  'src/pages/Register.jsx': `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Phone, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, fullName, phoneNumber: phone });
      setSuccessMsg('Registration successful! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Citizen Registration</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Join the civic safety network</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input 
            id="name" 
            label="Full Name" 
            placeholder="John Doe" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            icon={User} 
            required 
          />
          <Input 
            id="email" 
            type="email" 
            label="Email Address" 
            placeholder="citizen@domain.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            icon={Mail} 
            required 
          />
          <Input 
            id="phone" 
            type="tel" 
            label="Phone Number" 
            placeholder="+91 98765 43210" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            icon={Phone} 
            required 
          />
          <Input 
            id="password" 
            type="password" 
            label="Password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            icon={Lock} 
            required 
          />
          <Input 
            id="confirmPassword" 
            type="password" 
            label="Confirm Password" 
            placeholder="••••••••" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            icon={Lock} 
            required 
          />

          <p className="text-[11px] text-gray-400 font-mono">
            * All new accounts register as verified Citizens. Admin privileges are assigned securely via database administration.
          </p>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Complete Registration
          </Button>
        </form>

        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
          Already registered? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </p>
      </Card>
    </div>
  );
};`,

  // 6. ROUTER UPDATED WITH /profile ROUTE
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
}`,

  // 7. SECURITY MIGRATION FOR PROFILES & RLS
  'supabase/profile-rls.sql': `-- ==============================================================================
-- PROFILES ROW LEVEL SECURITY & ROLE TAMPERING PROTECTION
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Helper function: verify if requesting user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile or admins read all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own details" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

-- 3. Read policy: Users read their own profile; admins can read all
CREATE POLICY "Users can read own profile or admins read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 4. User update policy: Can edit full_name and phone_number ONLY. Cannot change role!
CREATE POLICY "Users can update own details"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Admin update policy: Only admins can change user roles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());
`
};

// Write all files
Object.entries(updates).forEach(([relPath, content]) => {
  const fullPath = path.join(root, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`  ✓ Updated: ${relPath}`);
});

console.log('\n🎉 SUCCESS! Authentication & Profile Dashboard files are completely updated.');