import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, Package, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';
import { PreorderCard } from '../../Preorders/components/PreorderCard';

interface OverviewPendingPreordersProps {
  loading: boolean;
  unreceivedPreorders: any[];
  totalAmountToPay: number;
  onMarkReceived: (preorder: any) => void;
  onViewGallery: (images: string[]) => void;
}

export function OverviewPendingPreorders({
  loading,
  unreceivedPreorders,
  totalAmountToPay,
  onMarkReceived,
  onViewGallery,
}: OverviewPendingPreordersProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="text-sm sm:text-base font-black text-text-main uppercase tracking-tight">
                Pending Preorders
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-accent-primary/10 text-accent-primary border border-accent-primary/20 uppercase tracking-wider">
                {unreceivedPreorders.length}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1 bg-bg-surface px-2.5 py-0.5 rounded-lg border border-border-subtle/80">
                Total Amount to Pay: <span className="font-black text-accent-soft">{formatCurrency(totalAmountToPay)}</span>
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/preorders"
          className="text-[10px] sm:text-xs font-black text-accent-primary hover:text-accent-soft flex items-center gap-1.5 uppercase tracking-widest transition-colors shrink-0 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="card-sophisticated p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : unreceivedPreorders.length === 0 ? (
        <div className="card-sophisticated p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/5 border border-accent-primary/10 flex items-center justify-center text-text-muted">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-main uppercase tracking-tight">No Pending Preorders</p>
            <p className="text-xs text-text-muted mt-1">All ordered figures have arrived or none are recorded yet.</p>
          </div>
          <Link
            to="/dashboard/preorders"
            className="mt-2 px-4 py-2 bg-accent-primary text-white hover:bg-accent-soft rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Add New Preorder
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {unreceivedPreorders.map((preorder) => (
            <PreorderCard
              key={preorder.id}
              preorder={preorder}
              onMarkReceived={onMarkReceived}
              onViewGallery={onViewGallery}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
