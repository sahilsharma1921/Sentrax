const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;

// 1. Files and Contents Dictionary
const files = {
  'package.json': `{
  "name": "sentrax",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.4.7",
    "leaflet": "^1.9.4",
    "leaflet.heat": "^0.2.0",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.29.0",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "vite": "^6.1.0"
  }
}`,

  'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});`,

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
      },
    },
  },
  plugins: [],
};`,

  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,

  'index.html': `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sentrax | Crime Heatmap & Emergency Response</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  </head>
  <body class="bg-gray-50 text-gray-900 dark:bg-dark-bg dark:text-gray-100 font-body antialiased transition-colors duration-200">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

  'vercel.json': `{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`,

  '.env.example': `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`,

  '.env': `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`,

  '.gitignore': `node_modules
dist
dist-ssr
*.local
.env
.env.local
.DS_Store`,

  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { overflow-x: hidden; }
  h1, h2, h3, h4, h5, h6 { font-family: theme('fontFamily.heading'); }
}

.glass-panel {
  background: rgba(18, 20, 28, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.light .glass-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
}`,

  'src/lib/constants.js': `export const CRIME_CATEGORIES = [
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
};`,

  'src/lib/supabase.js': `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);`,

  'src/lib/soundAlert.js': `export const playEmergencyAlarm = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
};`,

  'src/lib/riskEngine.js': `export const calculateAreaRiskScore = (reports) => {
  if (!reports || reports.length === 0) {
    return { score: 0, level: 'Low', color: '#10B981', count: 0 };
  }
  const now = new Date();
  let cumulativeWeight = 0;

  reports.forEach((r) => {
    const severity = r.severity || r.crime_categories?.severity_weight || 1;
    const incidentDate = new Date(r.incident_date);
    const daysElapsed = Math.max(0, (now - incidentDate) / (1000 * 60 * 60 * 24));
    const recencyFactor = Math.max(0.1, 1.0 - daysElapsed / 60);
    cumulativeWeight += severity * recencyFactor;
  });

  const normalizedScore = Math.min(100, Math.round((cumulativeWeight / 35) * 100));
  let level = 'Low';
  let color = '#10B981';

  if (normalizedScore >= 70) {
    level = 'High';
    color = '#EF4444';
  } else if (normalizedScore >= 40) {
    level = 'Medium';
    color = '#F59E0B';
  }

  return { score: normalizedScore, level, color, count: reports.length };
};

export const groupReportsByGridSector = (reports) => {
  const sectors = {};
  reports.forEach((r) => {
    const sectorKey = \`\${r.latitude.toFixed(2)},\${r.longitude.toFixed(2)}\`;
    if (!sectors[sectorKey]) {
      sectors[sectorKey] = {
        lat: parseFloat(r.latitude.toFixed(2)),
        lng: parseFloat(r.longitude.toFixed(2)),
        address: r.address || 'Kanpur Urban Sector',
        reports: [],
      };
    }
    sectors[sectorKey].reports.push(r);
  });
  return Object.values(sectors).map((sector) => ({
    ...sector,
    risk: calculateAreaRiskScore(sector.reports),
  }));
};`,

  'src/context/ThemeContext.jsx': `import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('sentrax-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('sentrax-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('sentrax-theme', 'light');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(p => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);`,

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
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch { return null; }
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
      } finally { setLoading(false); }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (e, session) => {
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
      email, password, options: { data: { full_name: fullName, phone_number: phoneNumber } }
    });
    if (error) throw error;
    return data;
  };

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role || 'citizen';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, role, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);`,

  'src/hooks/useTheme.js': `export { useTheme } from '../context/ThemeContext';`,
  'src/hooks/useAuth.js': `export { useAuth } from '../context/AuthContext';`,

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
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[50px]',
  };
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-glow focus:ring-primary',
    danger: 'bg-danger text-white hover:bg-danger-hover shadow-glow-danger focus:ring-danger',
    outline: 'border border-dark-border text-gray-200 hover:bg-white/5 focus:ring-primary',
    secondary: 'bg-dark-surface text-gray-100 hover:bg-dark-surfaceHover border border-dark-border',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={\`\${base} \${sizes[size]} \${variants[variant]} \${className}\`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      <span>{children}</span>
    </button>
  );
};`,

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
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
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
          className={\`w-full rounded-xl bg-gray-50 dark:bg-dark-surface text-gray-900 dark:text-gray-100 border \${
            error ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-dark-border focus:ring-primary'
          } \${Icon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 \${className}\`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  );
};`,

  'src/components/ui/Card.jsx': `import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hoverEffect = false, onClick, ...props }) => {
  const content = (
    <div
      onClick={onClick}
      className={\`glass-panel rounded-2xl p-6 transition-all duration-300 \${
        hoverEffect ? 'hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow' : ''
      } \${className}\`}
      {...props}
    >
      {children}
    </div>
  );

  if (hoverEffect) {
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
        {content}
      </motion.div>
    );
  }

  return content;
};`,

  'src/components/ui/Badge.jsx': `import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-white/10 text-gray-300 border-white/10',
    primary: 'bg-primary/15 text-primary border-primary/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    success: 'bg-success/15 text-success border-success/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight \${styles[variant]} \${className}\`}>
      {children}
    </span>
  );
};`,

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className={\`relative w-full \${maxWidth} glass-panel border border-dark-border rounded-2xl shadow-2xl p-6 z-10\`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-border mb-4">
              <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};`,

  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
};

// 2. Directory Creator and File Writer
console.log('📦 Creating Sentrax project tree...');

Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(root, relPath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`  ✓ Created: ${relPath}`);
});

console.log('\n🗜️ Bundling into Sentrax.zip...');

try {
  // Use native PowerShell Compress-Archive on Windows
  execSync(`powershell -command "Compress-Archive -Path '${root}' -DestinationPath '${path.join(__dirname, 'Sentrax.zip')}' -Force"`);
  console.log('🎉 SUCCESS! Sentrax.zip has been generated in your Downloads folder!');
} catch (err) {
  console.warn('Zip command fallback:', err.message);
  console.log('The files are ready in C:\\Users\\Lenovo\\Downloads\\Sentrax');
}