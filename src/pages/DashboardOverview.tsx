import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { TrendingUp, Package, Clock, Shield } from 'lucide-react';

export function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    figures: 0,
    preorders: 0,
    equipment: 0,
    figureCost: 0,
    shippingCost: 0,
    equipmentCost: 0,
  });

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const figuresQuery = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    const preordersQuery = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    const equipmentQuery = query(collection(db, 'equipments'), where('userId', '==', user.uid));

    let figuresLoaded = false;
    let preordersLoaded = false;
    let equipmentLoaded = false;

    const checkLoading = () => {
      if (figuresLoaded && preordersLoaded && equipmentLoaded) {
        setLoading(false);
      }
    };

    const unsubFigures = onSnapshot(figuresQuery, (snapshot) => {
      let cost = 0;
      let shipping = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        cost += data.totalPrice || 0;
        shipping += data.shippingCost || 0;
      });
      setStats(prev => ({ ...prev, figures: snapshot.size, figureCost: cost, shippingCost: shipping }));
      figuresLoaded = true;
      checkLoading();
    });

    const unsubPreorders = onSnapshot(preordersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, preorders: snapshot.size }));
      preordersLoaded = true;
      checkLoading();
    });

    const unsubEquipment = onSnapshot(equipmentQuery, (snapshot) => {
      let cost = 0;
      snapshot.docs.forEach(doc => {
        cost += doc.data().totalPrice || 0;
      });
      setStats(prev => ({ ...prev, equipment: snapshot.size, equipmentCost: cost }));
      equipmentLoaded = true;
      checkLoading();
    });

    return () => {
      unsubFigures();
      unsubPreorders();
      unsubEquipment();
    };
  }, [user]);

  const totalExpenses = stats.figureCost + stats.equipmentCost + stats.shippingCost;

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", damping: 15, stiffness: 100 }
    }
  };

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 md:relative z-30 bg-bg-deep/80 backdrop-blur-md md:bg-transparent py-4 md:py-0"
      >
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-main uppercase">
          WELCOME, <span className="text-accent-primary">COLLECTOR.</span>
        </h2>
        <p className="text-text-muted text-[10px] sm:text-xs mt-1 font-medium tracking-wide uppercase">
          Your Gallery thrives. <span className="text-accent-soft">{stats.preorders} preorder{stats.preorders !== 1 ? 's' : ''}</span> are on the horizon.
        </p>
      </motion.header>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { icon: TrendingUp, label: "Overall", value: totalExpenses, sub: `total` },
          { 
            icon: Package, 
            label: "Figures", 
            value: stats.figureCost, 
            extra: stats.shippingCost > 0 ? ` (+${formatCurrency(stats.shippingCost).replace('$', '')})` : '',
            sub: `${stats.figures} items` 
          },
          { icon: Shield, label: "Equipment", value: stats.equipmentCost, sub: `${stats.equipment} units` }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-sophisticated p-2.5 sm:p-4 group cursor-default h-full flex flex-col justify-between"
          >
            <div>
              <div className="text-[7px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-text-muted mb-2 font-black flex items-center gap-1 sm:gap-2">
                <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-accent-primary/5 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white transition-all duration-300 shrink-0">
                  <item.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="truncate">
                  {item.label}
                  <span className="hidden sm:inline"> Expenses</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1">
                <p className="text-xs sm:text-lg lg:text-xl font-black text-text-main tracking-tighter truncate">
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin inline-block align-middle" />
                  ) : (
                    formatCurrency(item.value)
                  )}
                </p>
                {'extra' in item && (
                  <span className="text-[8px] sm:text-[10px] font-bold text-accent-soft shrink-0">
                    {item.extra}
                  </span>
                )}
              </div>
            </div>
            <p className="text-[7px] sm:text-[10px] text-text-muted mt-2 font-semibold uppercase tracking-tight sm:tracking-wider truncate">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-red rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Clock className="text-white w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-text-main tracking-tight uppercase">Public Showcase</h4>
            <p className="text-xs text-text-muted font-medium">Your curated Gallery is broadcasting to the world.</p>
          </div>
        </div>
        
        <Link 
          to={`/profile/${user?.uid}`} 
          className="w-full sm:w-auto px-6 py-2 bg-bg-card hover:bg-accent-primary hover:text-white border border-border-subtle rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center"
        >
          View Exhibition Archive
        </Link>
      </motion.div>
    </div>
  );
}
