import React, { useState, useEffect } from 'react';
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
};