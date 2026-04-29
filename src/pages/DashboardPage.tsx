import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardOverview } from './DashboardOverview';
import { ActionFiguresPage } from './ActionFiguresPage';
import { PreordersPage } from './PreordersPage';
import { EquipmentsPage } from './EquipmentsPage';
import { ShowcasePage } from './ShowcasePage';
import { SettingsPage } from './SettingsPage';
import { DarkModeToggle } from '../hooks/useDarkMode';
import { LayoutDashboard, Library, Clock, Shield, User, LogOut, Settings, X, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close menu on location change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location]);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Figures', path: '/dashboard/figures', icon: Library },
    { label: 'Preorders', path: '/dashboard/preorders', icon: Clock },
    { label: 'Equipment', path: '/dashboard/equipments', icon: Shield },
    { label: 'Showcase', path: '/dashboard/showcase', icon: User },
  ];

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-accent-primary to-accent-soft rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent-primary/20">
            <Library className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-base font-black text-text-main tracking-tighter uppercase italic">KuraDex</h1>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <button 
            onClick={() => setIsUserMenuOpen(true)}
            className="w-8 h-8 rounded-lg overflow-hidden border border-border-subtle bg-bg-card flex items-center justify-center transition-all active:scale-95"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-text-muted" />
            )}
          </button>
        </div>

      </header>

      {/* Mobile User Menu Sidebar (Moved outside header for stacking context) */}
      <AnimatePresence>
        {isUserMenuOpen && (
          <div className="md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-bg-surface z-[210] shadow-2xl p-8 flex flex-col border-l border-border-subtle"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-accent-primary/20 bg-bg-card">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-accent-primary" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-black text-text-main leading-tight truncate">{user?.displayName}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Collector</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsUserMenuOpen(false)}
                  className="p-2 hover:bg-bg-card rounded-full transition-colors text-text-muted"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <Link
                  to="/dashboard/showcase"
                  className="flex items-center gap-4 p-5 rounded-2xl bg-bg-card hover:bg-accent-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-main uppercase tracking-widest">Showcase</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Customize Profile</p>
                  </div>
                </Link>

                <Link
                  to="/publicshowcase"
                  className="flex items-center gap-4 p-5 rounded-2xl bg-bg-card hover:bg-accent-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-main uppercase tracking-widest">Community</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Explore Galleries</p>
                  </div>
                </Link>

                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-4 p-5 rounded-2xl bg-bg-card hover:bg-accent-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-main uppercase tracking-widest">Settings</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Profile & Security</p>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-red-500/5 hover:bg-red-500 transition-all border border-red-500/10 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-red-500 group-hover:text-white transition-colors">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-red-500 group-hover:text-white uppercase tracking-widest">Log out</p>
                    <p className="text-[10px] text-red-500/60 group-hover:text-white/60 mt-0.5">End active session</p>
                  </div>
                </button>
              </div>

              <div className="mt-auto pt-8 border-t border-border-subtle">
                <div className="bg-accent-primary/5 rounded-2xl p-5 border border-accent-primary/10">
                   <p className="text-[9px] font-black text-accent-primary uppercase tracking-[0.2em] mb-2 text-center">Status: Authenticated</p>
                   <p className="text-[8px] text-text-muted text-center italic">{user?.email}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col p-10 border-r border-border-subtle bg-bg-surface fixed h-full overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-soft rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-accent-primary/20 rotate-3 animate-pulse">
              <Library className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase italic">KuraDex</h1>
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
            to="/publicshowcase"
             className={cn(
               "flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all group",
               location.pathname.startsWith('/publicshowcase') ? "bg-accent-primary/5 text-accent-primary" : "text-text-muted hover:bg-bg-card/80 hover:text-text-main"
             )}
          >
            <Users className="w-5 h-5" />
            <span>Community</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3 px-4 py-3 bg-bg-surface/50 border border-border-subtle rounded-full backdrop-blur-sm">
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
                className="p-2 text-text-muted hover:text-accent-primary transition-all hover:bg-text-main/5 rounded-full"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button 
                onClick={logout} 
                className="p-2 text-text-muted hover:text-accent-red transition-all hover:bg-text-main/5 rounded-full"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-4 sm:p-8 mb-24 md:mb-0">
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
                <Route path="showcase" element={<ShowcasePage />} />
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
      </nav>
    </div>
  );
}
