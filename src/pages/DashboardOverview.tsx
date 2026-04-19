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

    const figuresQuery = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    const preordersQuery = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    const equipmentQuery = query(collection(db, 'equipments'), where('userId', '==', user.uid));

    const unsubFigures = onSnapshot(figuresQuery, (snapshot) => {
      let cost = 0;
      let shipping = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        cost += data.totalPrice || 0;
        shipping += data.shippingCost || 0;
      });
      setStats(prev => ({ ...prev, figures: snapshot.size, figureCost: cost, shippingCost: shipping }));
    });

    const unsubPreorders = onSnapshot(preordersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, preorders: snapshot.size }));
    });

    const unsubEquipment = onSnapshot(equipmentQuery, (snapshot) => {
      let cost = 0;
      snapshot.docs.forEach(doc => {
        cost += doc.data().totalPrice || 0;
      });
      setStats(prev => ({ ...prev, equipment: snapshot.size, equipmentCost: cost }));
    });

    return () => {
      unsubFigures();
      unsubPreorders();
      unsubEquipment();
    };
  }, [user]);

  const totalExpenses = stats.figureCost + stats.equipmentCost;

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
    <div className="space-y-10">
      <motion.header
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          WELCOME, <span className="text-accent-primary">COLLECTOR.</span>
        </h2>
        <p className="text-text-muted text-sm mt-2 font-medium tracking-wide">
          Your Gallery thrives. <span className="text-accent-soft">{stats.preorders} preorders</span> are on the horizon.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { icon: TrendingUp, label: "Overall Expenses", value: totalExpenses, sub: `${stats.figures + stats.preorders} total entries` },
          { icon: Package, label: "Figure Expenses", value: stats.figureCost, sub: `${stats.figures} tracked items` },
          { icon: Shield, label: "Equipment Expenses", value: stats.equipmentCost, sub: `${stats.equipment} units documented` }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-sophisticated group cursor-default"
          >
            <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted mb-4 font-black flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/5 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white transition-all duration-300">
                <item.icon className="w-4 h-4" />
              </div>
              {item.label}
            </div>
            <p className="text-3xl font-black text-text-main tracking-tighter">
              {formatCurrency(item.value)}
            </p>
            <p className="text-[11px] text-text-muted mt-3 font-semibold uppercase tracking-wider">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden bg-bg-surface border border-border-subtle p-8 rounded-[2rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-primary to-accent-red rounded-2xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Clock className="text-white w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black text-text-main tracking-tight uppercase">Public Showcase</h4>
            <p className="text-sm text-text-muted font-medium">Your curated Gallery is broadcasting to the world.</p>
          </div>
        </div>
        
        <Link 
          to={`/profile/${user?.uid}`} 
          className="w-full sm:w-auto px-8 py-3 bg-bg-card hover:bg-accent-primary hover:text-white border border-border-subtle rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 text-center"
        >
          View Exhibition Archive
        </Link>
      </motion.div>
    </div>
  );
}
