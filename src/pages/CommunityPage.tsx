import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/Loading';
import { Link } from 'react-router-dom';
import { User, Shield, Sparkles, ExternalLink, ArrowRight, Users, Home, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function CommunityPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-bg-deep p-4 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 space-y-4 relative">
          <div className="absolute top-0 right-0 flex items-center gap-4">
             {currentUser ? (
               <Link 
                 to="/dashboard" 
                 className="flex items-center gap-2 px-5 py-3 bg-bg-card border border-border-subtle rounded-2xl text-text-main font-black text-[10px] uppercase tracking-widest hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-all shadow-xl shadow-black/5"
               >
                 <Home className="w-4 h-4" />
                 Control Deck
               </Link>
             ) : (
               <Link 
                 to="/" 
                 className="flex items-center gap-2 px-5 py-3 bg-accent-primary text-white border border-accent-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-primary/80 transition-all shadow-xl shadow-accent-primary/20"
               >
                 <LogIn className="w-4 h-4" />
                 Sign In
               </Link>
             )}
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-primary" />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary">Community Hub</h2>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-black text-text-main tracking-tighter italic">
            EXPLORE THE <span className="text-accent-primary">COLLECTIVE</span>
          </h1>
          <p className="text-text-muted text-sm sm:text-base max-w-2xl font-medium">
            Discover exhibitions from curators around the globe. Connect with fellow collectors and browse their virtual archives.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative cursor-pointer"
            >
              <Link to={`/publicshowcase/${user.id}`} className="block">
                <div className="card-sophisticated p-6 h-full flex flex-col gap-6 group-hover:border-accent-primary/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border-subtle bg-bg-card transition-transform group-hover:scale-105">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                              <User className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        {user.id === currentUser?.uid && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center text-white border-2 border-bg-surface">
                            <User className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-text-main tracking-tight line-clamp-1">
                          {user.displayName || "Unknown Collector"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Shield className="w-3 h-3 text-accent-primary" />
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Verified Curator</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted group-hover:text-accent-primary group-hover:bg-accent-primary/5 transition-all">
                       <ExternalLink className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border-subtle flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Joined</p>
                       <p className="text-xs font-bold text-text-main">
                         {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                       </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      View Gallery <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && (
           <div className="py-20 text-center space-y-6">
              <div className="w-16 h-16 bg-bg-card rounded-3xl flex items-center justify-center mx-auto border border-border-subtle">
                 <Users className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No active curators discovered yet.</p>
           </div>
        )}
      </div>
    </div>
  );
}
