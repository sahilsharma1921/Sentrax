const fs = require('fs');
const path = require('path');

const root = __dirname;

const updates = {
  // 1. IMPROVED STYLESHEET (Clean light mode & dark mode frosted glass)
  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    overflow-x: hidden;
    @apply bg-slate-50 text-gray-900 dark:bg-dark-bg dark:text-gray-100;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: theme('fontFamily.heading');
  }
}

/* Glass panel default for Light Mode */
.glass-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

/* Glass panel override for Dark Mode */
.dark .glass-panel {
  background: rgba(18, 20, 28, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}`,

  // 2. INPUT COMPONENT (Visible text in both modes)
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
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
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
          className={\`w-full rounded-xl bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 \${
            error ? 'border-danger focus:ring-danger' : ''
          } \${Icon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 text-sm transition-colors focus:outline-none \${className}\`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  );
};`,

  // 3. APPLAYOUT (Navbar & Sidebar text clearly readable in Light & Dark modes)
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
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{profile?.full_name || user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-mono">{profile?.role || 'Citizen'}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-500 hover:text-danger">
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
            {user && <NotificationBell />}
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
        <NavLink to="/sos" className="flex flex-col items-center justify-center py-1 px-2 text-danger">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-bold mt-1">SOS</span>
        </NavLink>
      </nav>
    </div>
  );
};`,

  // 4. LOGIN PAGE (Crisp dark text on card)
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
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Sign In to Sentrax</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter credentials to access the safety platform</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input id="email" type="email" label="Email Address" placeholder="citizen@sentrax.org" value={email} onChange={e => setEmail(e.target.value)} icon={Mail} required />
          <Input id="password" type="password" label="Password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} icon={Lock} required />
          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>Sign In</Button>
        </form>
        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
          New here? <Link to="/register" className="text-primary font-bold hover:underline">Register as Citizen</Link>
        </p>
      </Card>
    </div>
  );
};`,

  // 5. REGISTER PAGE (Crisp dark text on card)
  'src/pages/Register.jsx': `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Phone, Lock } from 'lucide-react';
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
      alert('Registered successfully! Please sign in.');
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
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Citizen Registration</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Join the civic safety network</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <Input id="name" label="Full Name" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} icon={User} required />
          <Input id="email" type="email" label="Email Address" placeholder="citizen@domain.com" value={email} onChange={e => setEmail(e.target.value)} icon={Mail} required />
          <Input id="phone" label="Phone Number" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} icon={Phone} required />
          <Input id="password" type="password" label="Password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} icon={Lock} required />
          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>Register</Button>
        </form>
        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
          Already registered? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </p>
      </Card>
    </div>
  );
};`,

  // 6. HOME PAGE (Crisp headings & buttons)
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
      <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
        Crime Heatmap & <span className="text-primary">Emergency Response</span>
      </h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-base">
        Crowdsourced crime reporting, real-time spatial heatmaps, and one-tap emergency SOS broadcast.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/report"><Button variant="primary" size="lg" icon={ArrowRight}>Report Incident</Button></Link>
        <Link to="/heatmap"><Button variant="outline" size="lg" icon={Flame} className="text-gray-800 dark:text-white">Live Heatmap</Button></Link>
      </div>
    </div>
  );
};`
};

// Write files
console.log('Fixing Light & Dark mode text colors...');
Object.entries(updates).forEach(([relPath, content]) => {
  const fullPath = path.join(root, relPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`✓ Updated: ${relPath}`);
});
console.log('\n🎉 SUCCESS: All Light Mode fonts and colors are now fixed!');