import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Package, Shield } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';

interface OverviewMetricsProps {
  loading: boolean;
  figureCost: number;
  figureGiftedValue: number;
  figureCount: number;
  equipmentCost: number;
  equipmentCount: number;
}

export function OverviewMetrics({
  loading,
  figureCost,
  figureGiftedValue,
  figureCount,
  equipmentCost,
  equipmentCount,
}: OverviewMetricsProps) {
  const totalOverallValue = figureCost + figureGiftedValue + equipmentCost;

  const items = [
    {
      icon: TrendingUp,
      label: 'Total',
      value: totalOverallValue,
      sub: 'overall value',
    },
    {
      icon: Package,
      label: 'Figures',
      value: figureCost,
      giftedValue: figureGiftedValue,
      sub: `${figureCount} items`,
    },
    {
      icon: Shield,
      label: 'Equipment',
      value: equipmentCost,
      sub: `${equipmentCount} units`,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card-sophisticated p-2 sm:p-4 group cursor-default h-full flex flex-col justify-between"
        >
          <div>
            <div className="text-[7px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-text-muted mb-2 font-black flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-accent-primary/5 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white transition-all duration-300 shrink-0">
                <item.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <span className="truncate">
                {item.label === 'Total' ? (
                  'OVERALL TOTAL'
                ) : (
                  <>
                    {item.label}
                    <span className="hidden sm:inline"> Expenses</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <p className="text-xs sm:text-lg lg:text-xl font-black text-text-main tracking-tighter truncate">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin inline-block align-middle" />
                ) : (
                  formatCurrency(item.value)
                )}
              </p>
              {'giftedValue' in item && item.giftedValue! > 0 && (
                <div className="flex items-center gap-0.5 text-emerald-500 font-bold shrink-0">
                  <span className="text-[8px] sm:text-[10px] uppercase tracking-tighter sm:tracking-normal">
                    (+{formatCurrency(item.giftedValue!).replace('$', '')})
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="text-[7px] sm:text-[10px] text-text-muted mt-2 font-semibold uppercase tracking-tight sm:tracking-wider truncate">
            {item.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
