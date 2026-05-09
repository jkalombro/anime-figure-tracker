import { Link, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, LayoutDashboard, Library, Clock, Shield, Users } from 'lucide-react';
import { cn } from '../../../shared/utils/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  user: any;
  logout: () => void;
  navItems: any[];
}

export function Sidebar({ user, logout, navItems }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="hidden md:flex w-72 flex-col p-10 border-r border-border-subtle bg-bg-surface fixed h-full overflow-y-auto">
      <div className="flex items-center justify-between gap-4 mb-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center transition-transform hover:scale-110">
            <img 
              src="https://res.cloudinary.com/dydhpzure/image/upload/v1777735809/awectavedp0w33t4q32k.png" 
              alt="KuraDex Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase italic">
            Kura<span className="text-accent-soft">Dex</span>
          </h1>
        </div>
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
  );
}
