import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, X, Users, Shield } from 'lucide-react';
import { cn } from '../../../shared/utils/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../shared/context/AuthContext';

interface MobileNavigationProps {
  user: any;
  logout: () => void;
  navItems: any[];
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
}

export function MobileNavigation({
  user,
  logout,
  navItems,
  isUserMenuOpen,
  setIsUserMenuOpen,
}: MobileNavigationProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-110">
            <img 
              src="https://res.cloudinary.com/dydhpzure/image/upload/v1777735809/awectavedp0w33t4q32k.png" 
              alt="KuraDex Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-base font-black text-text-main tracking-tighter uppercase italic">
            Kura<span className="text-accent-soft">Dex</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Mobile User Menu Sidebar */}
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

                {isAdmin && (
                  <Link
                    to="/dashboard/administration"
                    className="flex items-center gap-4 p-5 rounded-2xl bg-bg-card hover:bg-accent-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-main uppercase tracking-widest">Administration</p>
                      <p className="text-[10px] text-text-muted mt-0.5">System Overview</p>
                    </div>
                  </Link>
                )}

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
    </>
  );
}
