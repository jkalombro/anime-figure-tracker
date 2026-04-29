import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LoadingScreen } from '../components/Loading';
import { Box, Package, User as UserIcon, Camera, Home, Users, LogIn, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { DarkModeToggle } from '../hooks/useDarkMode';
import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [figures, setFigures] = useState<any[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
          
          const figuresQuery = query(
            collection(db, 'actionFigures'), 
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          );
          const figuresSnap = await getDocs(figuresQuery);
          setFigures(figuresSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          const showcasesQuery = query(
            collection(db, 'showcases'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          );
          const showcasesSnap = await getDocs(showcasesQuery);
          setShowcases(showcasesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (loading) return <LoadingScreen />;
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 bg-bg-deep">
      <motion.h2 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-5xl font-black text-text-main tracking-tighter"
      >
        GALLERY <span className="text-accent-primary">NOT FOUND</span>
      </motion.h2>
      <p className="text-text-muted max-w-xs font-medium uppercase tracking-widest text-xs">This curator hasn't opened their exhibition archive yet.</p>
      {currentUser ? (
        <Link to="/dashboard" className="btn-primary-sophisticated flex items-center gap-2">
          <Home className="w-5 h-5" />
          RETURN TO HOME
        </Link>
      ) : (
        <Link to="/" className="btn-primary-sophisticated flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          SIGN IN
        </Link>
      )}
      <Link to="/publicshowcase" className="text-text-muted hover:text-accent-primary transition-colors font-black text-[10px] uppercase tracking-widest mt-4">
        Explore Community instead
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-deep pb-20 text-text-main">
      <div className="h-48 sm:h-64 bg-bg-surface relative overflow-hidden border-b border-border-subtle">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 0.15 }}
           className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-accent-primary)_0%,_transparent_70%)]"
        />
        <div className="absolute top-6 left-6 flex gap-4">
           {currentUser ? (
             <Link to="/dashboard" className="p-3 glass rounded-2xl text-text-main hover:bg-accent-primary hover:text-white transition-all" title="Go to Dashboard">
                <LayoutDashboard className="w-5 h-5" />
             </Link>
           ) : (
             <Link to="/" className="p-3 glass rounded-2xl text-text-main hover:bg-accent-primary hover:text-white transition-all" title="Sign In">
                <LogIn className="w-5 h-5" />
             </Link>
           )}
        </div>
        <div className="absolute top-6 right-6 flex gap-4">
           <div className="glass p-2 rounded-2xl flex items-center gap-2">
             <DarkModeToggle subtitle="" />
           </div>
           <Link to="/publicshowcase" className="p-3 glass rounded-2xl text-text-main hover:bg-accent-primary hover:text-white transition-all" title="Return to Community">
              <Users className="w-5 h-5" />
           </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="relative -mt-16 flex flex-col items-start gap-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-1 glass rounded-[2rem]"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.75rem] overflow-hidden border-4 border-accent-primary shadow-2xl">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-card flex items-center justify-center text-accent-primary">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
          </motion.div>
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tighter uppercase italic"
            >
              {profile.displayName}<span className="text-accent-primary">.GALLERY</span>
            </motion.h1>
            <p className="text-text-muted font-black uppercase tracking-[0.4em] text-[10px]">CURATOR SIG: {userId?.substring(0, 10).toUpperCase()}</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
           {[
             { label: 'Figures', val: figures.length },
             { label: 'Scaled', val: figures.filter(f => f.scale && f.scale !== '').length },
             { label: 'Series', val: new Set(figures.map(f => f.sourceAnime)).size },
             { label: 'Net Worth', val: formatCurrency(figures.reduce((acc, f) => acc + f.totalPrice, 0)).split('.')[0] }
           ].map((stat, i) => (
             <div key={i} className="card-sophisticated p-4 text-center group">
                <p className="text-3xl font-black text-text-main tracking-tighter group-hover:text-accent-primary transition-colors">{stat.val}</p>
                <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em] mt-2">{stat.label}</p>
             </div>
           ))}
        </motion.div>

        {showcases.length > 0 && (
          <section className="mt-24 space-y-12">
            <div className="flex items-center gap-6">
              <h2 className="text-xs font-black uppercase tracking-[0.5em] text-accent-soft text-right">FEATURED EXHIBITIONS</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-l from-accent-soft/20 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {showcases.map((showcase, idx) => (
                 <motion.div
                   key={showcase.id}
                   initial={{ opacity: 0, x: -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: idx * 0.1 }}
                   className="card-sophisticated border-accent-soft/10 bg-gradient-to-br from-accent-soft/5 to-transparent overflow-hidden"
                 >
                   <div className="h-40 bg-bg-deep relative">
                      {showcase.imageUrls?.[0] && (
                        <img src={showcase.imageUrls[0]} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 to-transparent" />
                   </div>
                   <div className="p-6 space-y-3">
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-text-main group-hover:text-accent-soft transition-colors">{showcase.name}</h3>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {showcase.description}
                      </p>
                      {showcase.imageUrls?.length > 1 && (
                         <div className="flex gap-2 pt-2">
                            {showcase.imageUrls.slice(1).map((img: string, i: number) => (
                               <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-border-subtle">
                                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                 </motion.div>
               ))}
            </div>
          </section>
        )}

        <section className="mt-24 space-y-12">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-accent-primary">EXHIBITION ARCHIVE</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-accent-primary/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {figures.map((figure, idx) => (
                <motion.div
                  key={figure.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-bg-surface border border-border-subtle">
                    {figure.imageUrls?.[0] ? (
                      <>
                        <img 
                          src={figure.imageUrls[0]} 
                          alt={figure.characterName} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                        />
                        {figure.imageUrls.length > 1 && (
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white/90 border border-white/10">
                            +{figure.imageUrls.length - 1} VIEWS
                          </div>
                        )}
                      </>
                    ) : figure.imageUrl ? (
                      <img 
                        src={figure.imageUrl} 
                        alt={figure.characterName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-text-muted/20">
                          <Package className="w-12 h-12" />
                       </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/90 via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute bottom-0 inset-x-0 p-6 space-y-1">
                      <div className="flex items-center gap-2">
                        {figure.scale && (
                           <span className="text-[10px] text-accent-soft font-bold uppercase tracking-wider">{figure.scale}</span>
                        )}
                        <span className="text-[10px] text-text-muted font-medium uppercase tracking-widest">{figure.maker}</span>
                      </div>
                      <h3 className="text-lg font-medium text-text-main">{figure.characterName}</h3>
                      <p className="text-xs text-text-muted italic">{figure.sourceAnime}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {figures.length === 0 && (
          <div className="mt-20 p-20 surface-container text-center space-y-4">
             <Box className="w-12 h-12 text-border-subtle mx-auto" />
             <p className="text-text-muted font-medium text-sm">The exhibition is currently in preparation.</p>
          </div>
        )}
      </div>

      <footer className="mt-40 text-center py-12 border-t border-border-subtle">
        <p className="text-text-muted/30 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
           Showcased on <span className="text-accent-soft">KuraDex</span>
        </p>
      </footer>
    </div>
  );
}
