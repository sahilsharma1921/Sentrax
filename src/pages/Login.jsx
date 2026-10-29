import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Shield, User, ShieldCheck, Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'citizen';
  
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin' || roleParam === 'citizen') {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate credentials with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error('Authentication failed.');

      // 2. Fetch authoritative role from public.profiles table
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .maybeSingle();

      const verifiedRole = profileData?.role || 'citizen';

      // 3. Strict Role Verification Check
      if (selectedRole === 'admin' && verifiedRole !== 'admin') {
        // Mismatch: Citizen trying to log in as Admin
        await supabase.auth.signOut();
        setErrorMsg('Access Denied: This account is registered as a Citizen and lacks Administrator clearance. Please select "Login as Citizen".');
        setLoading(false);
        return;
      }

      if (selectedRole === 'citizen' && verifiedRole === 'admin') {
        // Mismatch: Admin trying to sign in under Citizen portal
        await supabase.auth.signOut();
        setErrorMsg('Role Mismatch: This account holds Administrator credentials. Please select "Login as Admin" to access the Command Center.');
        setLoading(false);
        return;
      }

      // 4. Synchronize active state
      if (refreshProfile) {
        await refreshProfile();
      }

      // 5. Authorized Redirect
      if (verifiedRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        const redirectPath = location.state?.from?.pathname || '/dashboard';
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border border-dark-border/60">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-3">
            {selectedRole === 'admin' ? (
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            ) : (
              <Shield className="w-6 h-6 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {selectedRole === 'admin' ? 'Admin Command Login' : 'Citizen Sign In'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedRole === 'admin'
              ? 'Restricted access for emergency dispatch & incident verification'
              : 'Sign in to access crime heatmap, incident reporting & emergency SOS'}
          </p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border gap-1">
          <button
            type="button"
            onClick={() => { setSelectedRole('citizen'); setErrorMsg(''); }}
            className={'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ' + (selectedRole === 'citizen' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}
          >
            <User className="w-3.5 h-3.5" />
            <span>Login as Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedRole('admin'); setErrorMsg(''); }}
            className={'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ' + (selectedRole === 'admin' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login as Admin</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            id="email" 
            type="email" 
            label="Email Address" 
            placeholder={selectedRole === 'admin' ? 'admin@sentrax.org' : 'citizen@sentrax.org'} 
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

          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-dark-surface/50 border border-gray-200 dark:border-dark-border/40 text-[11px] text-gray-500 dark:text-gray-400">
            {selectedRole === 'admin' ? (
              <span className="text-purple-600 dark:text-purple-300 font-medium">
                🛡️ Verified role check: Only authorized personnel with database admin clearance can log in.
              </span>
            ) : (
              <span>
                👤 Citizen portal: Report incidents, view live crime heatmap, and trigger emergency SOS.
              </span>
            )}
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-2" 
            isLoading={loading}
            icon={ArrowRight}
          >
            {selectedRole === 'admin' ? 'Sign In as Administrator' : 'Sign In as Citizen'}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link 
            to={'/register?role=' + selectedRole} 
            className="text-primary font-bold hover:underline"
          >
            {selectedRole === 'admin' ? 'Register as Admin' : 'Register as Citizen'}
          </Link>
        </p>
      </Card>
    </div>
  );
};