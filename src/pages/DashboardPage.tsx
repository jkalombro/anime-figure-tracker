import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardOverview } from './DashboardOverview';
import { ActionFiguresPage } from './ActionFiguresPage';
import { PreordersPage } from './PreordersPage';
import { EquipmentsPage } from './EquipmentsPage';
import { SettingsPage } from './SettingsPage';
import { DarkModeToggle } from '../hooks/useDarkMode';
import { LayoutDashboard, Library, Clock, Shield, User, LogOut, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Figures', path: '/dashboard/figures', icon: Library },
    { label: 'Preorders', path: '/dashboard/preorders', icon: Clock },
    { label: 'Equipments', path: '/dashboard/equipments', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col md:flex-row font-sans">
      {/* Mobile-only Top Right Toggle */}
      <div className="fixed top-6 right-6 z-[60] md:hidden">
        <div className="glass p-2 rounded-2xl">
          <DarkModeToggle />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col p-10 border-r border-border-subtle bg-bg-surface fixed h-full overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-red rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-accent-primary/20 rotate-3 animate-pulse">
              <Library className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase italic">Figdex</h1>
          </div>
          <DarkModeToggle />
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-accent-primary/40 mb-4 ml-4">Monitor</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all group relative",
                  isActive 
                    ? "bg-accent-primary/5 text-accent-primary shadow-inner" 
                    : "text-text-muted hover:bg-bg-card/80 hover:text-text-main"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav" 
                    className="absolute inset-0 bg-accent-primary/10 rounded-2xl -z-10" 
                  />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-accent-primary" : "text-text-muted group-hover:text-accent-primary transition-colors")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-accent-primary/40 mt-10 mb-4 ml-4">Social</div>
          <Link
            to={`/profile/${user?.uid}`}
             className={cn(
               "flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all group",
               location.pathname.startsWith('/profile') ? "bg-accent-primary/5 text-accent-primary" : "text-text-muted hover:bg-bg-card/80 hover:text-text-main"
             )}
          >
            <User className="w-5 h-5" />
            <span>Showcase</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/50 dark:bg-white/5 border border-border-subtle rounded-full backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-sm flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-accent-primary/10 flex items-center justify-center">
                   <User className="w-5 h-5 text-accent-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-text-main truncate leading-tight">{user?.displayName}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link 
                to="/dashboard/settings" 
                className="p-2 text-text-muted hover:text-accent-primary transition-all hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button 
                onClick={logout} 
                className="p-2 text-text-muted hover:text-accent-red transition-all hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-8 sm:p-16 mb-24 md:mb-0">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Routes location={location}>
                <Route index element={<DashboardOverview />} />
                <Route path="figures" element={<ActionFiguresPage />} />
                <Route path="preorders" element={<PreordersPage />} />
                <Route path="equipments" element={<EquipmentsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-24 bg-bg-surface/80 backdrop-blur-xl border-t border-border-subtle flex items-center justify-around px-4 z-40 pb-4 shadow-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all relative overflow-hidden",
                isActive ? "text-accent-primary" : "text-text-muted"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div layoutId="mobileAccent" className="absolute bottom-0 left-0 right-0 h-1 bg-accent-primary rounded-full" />
              )}
            </Link>
          );
        })}
        <Link
          to={`/profile/${user?.uid}`}
          className={cn(
             "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all relative overflow-hidden",
             location.pathname.startsWith('/profile') ? "text-accent-primary" : "text-text-muted"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Showcase</span>
        </Link>
      </nav>
    </div>
  );
}
