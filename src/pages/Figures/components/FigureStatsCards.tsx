import React from 'react';
import { Package, ShoppingBag, Gift } from 'lucide-react';
import { formatCurrency, cn } from '../../../shared/utils/utils';

export type FigureFilterType = 'all' | 'purchased' | 'gifted';

interface FigureStatsCardsProps {
  activeFilter: FigureFilterType;
  onFilterChange: (filter: FigureFilterType) => void;
  totalPrice: number;
  purchasedPrice: number;
  giftsPrice: number;
  totalCount: number;
  purchasedCount: number;
  giftsCount: number;
}

export function FigureStatsCards({
  activeFilter,
  onFilterChange,
  totalPrice,
  purchasedPrice,
  giftsPrice,
  totalCount,
  purchasedCount,
  giftsCount,
}: FigureStatsCardsProps) {
  const cards = [
    {
      id: 'all' as const,
      label: 'Figure Expenses',
      mobileLabel: 'Total',
      value: totalPrice,
      count: totalCount,
      icon: Package,
      activeColor: 'bg-emerald-500/15',
      activeBorder: 'border-emerald-500',
      hoverBorder: 'hover:border-accent-primary/50',
    },
    {
      id: 'purchased' as const,
      label: 'Total Purchased',
      mobileLabel: 'Purchased',
      value: purchasedPrice,
      count: purchasedCount,
      icon: ShoppingBag,
      activeColor: 'bg-emerald-500/15',
      activeBorder: 'border-emerald-500',
      hoverBorder: 'hover:border-accent-primary/50',
    },
    {
      id: 'gifted' as const,
      label: 'Total Gifts',
      mobileLabel: 'Gifts',
      value: giftsPrice,
      count: giftsCount,
      icon: Gift,
      activeColor: 'bg-emerald-500/15',
      activeBorder: 'border-emerald-500',
      hoverBorder: 'hover:border-emerald-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {cards.map((item) => {
        const isSelected = activeFilter === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            className={cn(
              'card-sophisticated p-2 sm:p-4 transition-all text-left group border-2 h-full flex flex-col justify-between',
              isSelected
                ? `${item.activeColor} ${item.activeBorder} shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]`
                : `bg-bg-surface border-transparent ${item.hoverBorder}`
            )}
          >
            <div>
              <div
                className={cn(
                  'text-[7px] sm:text-[9px] uppercase font-black tracking-[0.1em] sm:tracking-[0.2em] flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3',
                  isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-emerald-500 text-white'
                      : 'bg-accent-primary/5 text-accent-primary group-hover:bg-accent-primary group-hover:text-white'
                  )}
                >
                  <item.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="truncate">
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1">
                <p className="text-[10px] sm:text-lg lg:text-xl font-black tracking-tighter truncate text-text-main">
                  {formatCurrency(item.value)}
                </p>
              </div>
            </div>

            <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider mt-2 opacity-70 text-text-muted">
              {item.count} item{item.count !== 1 ? 's' : ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}
