import React from 'react';
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