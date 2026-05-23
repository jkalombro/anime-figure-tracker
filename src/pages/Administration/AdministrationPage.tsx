import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { LoadingScreen } from '../../shared/components/Loading';
import { useAuth } from '../../shared/context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Package, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Search, 
  ArrowUpRight, 
  Mail, 
  Calendar,
  Gift,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../../shared/utils/utils';

export function AdministrationPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // System-wide aggregated stats
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalFigures: 0,
    totalPreorders: 0,
    totalEquipments: 0,
    totalPortfolioValue: 0,
  });

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    async function fetchAllStats() {
      try {
        setLoading(true);
        // 1. Fetch all users
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersSnap = await getDocs(usersQuery);
        const usersList = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        let aggregatedFiguresCount = 0;
        let aggregatedPreordersCount = 0;
        let aggregatedEquipmentsCount = 0;
        let aggregatedValuationSum = 0;

        // 2. Map through each user to fetch their statistical data
        const usersWithStats = await Promise.all(
          usersList.map(async (u: any) => {
            try {
              // Fetch figures
              const figuresSnap = await getDocs(
                query(collection(db, 'actionFigures'), where('userId', '==', u.id))
              );
              let figureCost = 0;
              let giftedValue = 0;
              figuresSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.isGifted) {
                  giftedValue += data.totalPrice || 0;
                } else {
                  figureCost += data.totalPrice || 0;
                }
              });

              // Fetch preorders
              const preordersSnap = await getDocs(
                query(collection(db, 'preorders'), where('userId', '==', u.id))
              );
              const activePreorders = preordersSnap.docs.filter(
                doc => !doc.data().receivedAt
              ).length;

              // Fetch equipment
              const equipmentsSnap = await getDocs(
                query(collection(db, 'equipments'), where('userId', '==', u.id))
              );
              let equipmentCost = 0;
              equipmentsSnap.docs.forEach(doc => {
                equipmentCost += doc.data().totalPrice || 0;
              });

              const totalWorth = figureCost + giftedValue + equipmentCost;

              // Accumulate aggregate calculations
              aggregatedFiguresCount += figuresSnap.size;
              aggregatedPreordersCount += activePreorders;
              aggregatedEquipmentsCount += equipmentsSnap.size;
              aggregatedValuationSum += totalWorth;

              return {
                ...u,
                stats: {
                  figuresCount: figuresSnap.size,
                  figuresCost: figureCost,
                  figuresGiftedValue: giftedValue,
                  activePreorders,
                  equipmentsCount: equipmentsSnap.size,
                  equipmentsCost: equipmentCost,
                  totalWorth,
                }
              };
            } catch (err) {
              console.error(`Error loading stats for user ${u.id}:`, err);
              return {
                ...u,
                stats: {
                  figuresCount: 0,
                  figuresCost: 0,
                  figuresGiftedValue: 0,
                  activePreorders: 0,
                  equipmentsCount: 0,
                  equipmentsCost: 0,
                  totalWorth: 0,
                }
              };
            }
          })
        );

        setSystemStats({
          totalUsers: usersList.length,
          totalFigures: aggregatedFiguresCount,
          totalPreorders: aggregatedPreordersCount,
          totalEquipments: aggregatedEquipmentsCount,
          totalPortfolioValue: aggregatedValuationSum,
        });

        setUsers(usersWithStats);
      } catch (err) {
        console.error("Error loaded administration data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllStats();
  }, [authLoading, isAdmin]);

  if (authLoading) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (loading) return <LoadingScreen />;

  // Filter users based on search (name or email)
  const filteredUsers = users.filter((u: any) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (u.displayName || '').toLowerCase().includes(term);
    const emailMatch = (u.email || '').toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 transition-all border-b border-border-subtle"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-soft/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent-soft" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-soft">Control Panel</h2>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-main uppercase mt-1 leading-none">
              ADMINISTRATION <span className="text-accent-primary">HUB</span>
            </h1>
            <p className="text-text-muted text-[10px] sm:text-xs mt-1 font-medium tracking-wide uppercase">
              System overview of system users and aggregate database collection summaries.
            </p>
          </div>
          
          <div className="relative max-w-xs w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search collectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-bg-card border border-border-subtle rounded-xl text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary/50 transition-all font-medium"
            />
          </div>
        </div>
      </motion.header>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { icon: Users, label: "Total Users", value: systemStats.totalUsers, format: "number" },
          { icon: Package, label: "Total Figures", value: systemStats.totalFigures, format: "number" },
          { icon: Clock, label: "Active Preorders", value: systemStats.totalPreorders, format: "number" },
          { icon: Shield, label: "Total Equipment", value: systemStats.totalEquipments, format: "number" },
          { icon: TrendingUp, label: "System Valuation", value: systemStats.totalPortfolioValue, format: "currency" }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card-sophisticated p-4 flex flex-col justify-between h-28 hover:border-accent-soft/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black tracking-widest text-text-muted uppercase">{item.label}</span>
              <div className="p-1 px-1.5 rounded bg-white/5 border border-white/5">
                <item.icon className="w-3.5 h-3.5 text-accent-soft" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-text-main tracking-tighter leading-none mt-2">
                {item.format === "currency" ? formatCurrency(item.value) : item.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Collectors Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-sophisticated overflow-hidden border border-border-subtle"
      >
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-bg-surface/50">
          <div>
            <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Registered Collectors</h3>
            <p className="text-[10px] text-text-muted">A detailed breakdown of all system collectors and their metrics.</p>
          </div>
          <span className="font-mono text-[10px] bg-accent-primary/10 text-accent-primary px-2.5 py-1 rounded-full font-bold">
            {filteredUsers.length} MEMBERS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-deep/40 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                <th className="py-4 px-6">Collector</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4 text-center">Figures</th>
                <th className="py-4 px-4 text-center">Preorders</th>
                <th className="py-4 px-4 text-center">Equipment</th>
                <th className="py-4 px-4 text-right">Portfolio Worth</th>
                <th className="py-4 px-6 text-right">Exhibition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 text-xs">
              {filteredUsers.map((collector: any) => {
                const isSuperAdmin = process.env.ADMIN_EMAIL && collector.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
                return (
                  <tr key={collector.id} className="hover:bg-bg-card/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-bg-card border border-border-subtle flex-shrink-0">
                          {collector.photoURL ? (
                            <img src={collector.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted bg-white/5">
                              <Users className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text-main">{collector.displayName || "Anonymous"}</span>
                            {isSuperAdmin && (
                              <span className="text-[8px] bg-accent-soft/10 text-accent-soft px-1.5 py-0.5 rounded border border-accent-soft/20 font-black tracking-widest uppercase">
                                OWNER
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-text-muted font-mono block mt-0.5">ID: {collector.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {collector.email ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-muted font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {collector.email}
                          </span>
                          <span className="text-[9px] text-text-muted font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {collector.createdAt?.toDate ? collector.createdAt.toDate().toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted italic">No Email Linked</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-text-main">{collector.stats?.figuresCount || 0}</span>
                      {collector.stats?.figuresCost + collector.stats?.figuresGiftedValue > 0 && (
                        <span className="block text-[9px] text-text-muted mt-0.5">
                          {formatCurrency(collector.stats.figuresCost + collector.stats.figuresGiftedValue)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-text-main">{collector.stats?.activePreorders || 0}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-text-main">{collector.stats?.equipmentsCount || 0}</span>
                      {collector.stats?.equipmentsCost > 0 && (
                        <span className="block text-[9px] text-text-muted mt-0.5">
                          {formatCurrency(collector.stats.equipmentsCost)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono font-black text-accent-soft">
                        {formatCurrency(collector.stats?.totalWorth || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/publicshowcase/${collector.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-accent-soft/10 text-text-main hover:text-accent-soft border border-white/5 hover:border-accent-soft/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Visit <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-xs uppercase tracking-widest text-text-muted font-bold">No collectors found matching "{searchTerm}"</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
