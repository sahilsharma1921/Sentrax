const fs = require('fs');
const path = require('path');

const root = __dirname;
console.log('🚀 Updating SENTRAX Login and Register with Citizen & Admin Roles...');

const updates = {
  // 1. UPDATE CONSTANTS WITH ADMIN SECURITY KEY
  'src/lib/constants.js': `export const ADMIN_SECURITY_KEY = import.meta.env.VITE_ADMIN_INVITE_KEY || 'SENTRAX-ADMIN-KANPUR-2026';

export const CRIME_CATEGORIES = [
  { value: 'Theft', label: 'Theft / Larceny', weight: 2 },
  { value: 'Assault', label: 'Physical Assault', weight: 4 },
  { value: 'Burglary', label: 'House Burglary', weight: 3 },
  { value: 'Vandalism', label: 'Property Vandalism', weight: 1 },
  { value: 'Harassment', label: 'Stalking & Harassment', weight: 3 },
  { value: 'Robbery', label: 'Armed Robbery', weight: 5 },
  { value: 'Cybercrime', label: 'Online Cybercrime', weight: 2 },
  { value: 'Other', label: 'Other Incident', weight: 1 },
];

export const REPORT_STATUSES = {
  pending: { label: 'Pending Review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'primary' },
  investigating: { label: 'Investigating', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};
`,

  // 2. UPDATED LOGIN PAGE WITH CITIZEN/ADMIN TABS & STRICT ROLE VERIFICATION
  'src/pages/Login.jsx': `import React, { useState, useEffect } from 'react';
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
`,

  // 3. UPDATED REGISTER PAGE WITH CITIZEN & ADMIN TABS AND PASSCODE AUTHORIZATION
  'src/pages/Register.jsx': `import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, User, ShieldCheck, Mail, Phone, Lock, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ADMIN_SECURITY_KEY } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'citizen';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin' || roleParam === 'citizen') {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

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

    // Secure Admin Passcode Verification
    if (selectedRole === 'admin') {
      const trimmedPasscode = adminPasscode.trim();
      if (!trimmedPasscode) {
        setErrorMsg('Admin authorization key is required for administrator registration.');
        return;
      }
      if (trimmedPasscode !== ADMIN_SECURITY_KEY) {
        setErrorMsg('Access Denied: Invalid Admin Authorization Key. You are not authorized to create an Administrator account.');
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Create Supabase Auth User
      const authData = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phone.trim() || null,
      });

      const newUserId = authData?.user?.id;

      // 2. Assign Role securely in public.profiles table
      if (selectedRole === 'admin') {
        // Attempt server-side security definer elevation function
        let elevated = false;
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('register_admin_account', {
            p_invite_code: adminPasscode.trim()
          });
          if (!rpcErr) elevated = true;
        } catch (e) {
          elevated = false;
        }

        // Fallback: direct upsert into profiles table
        if (!elevated && newUserId) {
          await supabase.from('profiles').upsert({
            id: newUserId,
            full_name: fullName.trim(),
            email: email.trim(),
            phone_number: phone.trim() || null,
            role: 'admin',
          });
        }

        setSuccessMsg('Administrator account registered and authorized! Redirecting to Admin Login...');
        setTimeout(() => navigate('/login?role=admin'), 2000);
      } else {
        // Citizen: Guarantee role is strictly 'citizen'
        if (newUserId) {
          await supabase.from('profiles').upsert({
            id: newUserId,
            full_name: fullName.trim(),
            email: email.trim(),
            phone_number: phone.trim() || null,
            role: 'citizen',
          });
        }
        setSuccessMsg('Citizen registration successful! Redirecting to Citizen Login...');
        setTimeout(() => navigate('/login?role=citizen'), 2000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
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
            {selectedRole === 'admin' ? 'Administrator Registration' : 'Citizen Registration'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedRole === 'admin' 
              ? 'Authorized registration for police & emergency coordinators' 
              : 'Join the civic safety network to report & monitor incidents'}
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
            <span>Register as Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedRole('admin'); setErrorMsg(''); }}
            className={'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ' + (selectedRole === 'admin' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Register as Admin</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
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
            placeholder={selectedRole === 'admin' ? 'admin@sentrax.org' : 'citizen@sentrax.org'} 
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

          {/* ADMIN SECURITY PASSCODE FIELD */}
          {selectedRole === 'admin' && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
              <Input 
                id="adminKey" 
                type="password" 
                label="Admin Authorization Key" 
                placeholder="Enter departmental passcode" 
                value={adminPasscode} 
                onChange={(e) => setAdminPasscode(e.target.value)} 
                icon={KeyRound} 
                required 
              />
              <p className="text-[11px] text-purple-600 dark:text-purple-300 leading-relaxed">
                🔒 Departmental clearance required. Unauthorized registration attempts are rejected.
              </p>
            </div>
          )}

          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
            {selectedRole === 'admin' ? (
              <span>* Admin privileges grant command center access & incident verification.</span>
            ) : (
              <span>* All citizen accounts receive standard incident reporting and heatmap access.</span>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            {selectedRole === 'admin' ? 'Verify & Register as Admin' : 'Complete Citizen Registration'}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
          Already registered?{' '}
          <Link 
            to={'/login?role=' + selectedRole} 
            className="text-primary font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </Card>
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

console.log('\\n✅ Role authentication updates successfully applied!');