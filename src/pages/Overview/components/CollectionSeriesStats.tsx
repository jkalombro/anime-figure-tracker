import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  DollarSign,
  Hash,
  Tv
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';

interface CollectionSeriesStatsProps {
  figures: any[];
  loading?: boolean;
}

// 8 Distinct vibrant progress bar color themes matching the screenshot aesthetic
const PALETTE_THEMES = [
  { barColor: '#10b981' }, // Vibrant emerald/teal bar
  { barColor: '#4ade80' }, // Vibrant lime bar
  { barColor: '#f59e0b' }, // Vibrant amber bar
  { barColor: '#f97316' }, // Vibrant orange bar
  { barColor: '#22c55e' }, // Vibrant green bar
  { barColor: '#eab308' }, // Vibrant gold bar
  { barColor: '#06b6d4' }, // Vibrant cyan bar
  { barColor: '#8b5cf6' }, // Vibrant purple bar
];

export function CollectionSeriesStats({ figures, loading }: CollectionSeriesStatsProps) {
  // Mode toggle: 'value' (by total price/valuation) or 'count' (by number of figures)
  const [metricMode, setMetricMode] = useState<'value' | 'count'>('value');
  const [isExpanded, setIsExpanded] = useState(false);

  // Group figures by sourceAnime
  const seriesData = useMemo(() => {
    if (!figures || figures.length === 0) return [];

    const map = new Map<string, { name: string; count: number; totalValue: number }>();

    figures.forEach((fig) => {
      const rawName = (fig.sourceAnime || fig.sourceSeries || 'Other / Original').trim();
      const normalizedKey = rawName.toLowerCase();
      const price = Number(fig.totalPrice) || 0;

      if (map.has(normalizedKey)) {
        const item = map.get(normalizedKey)!;
        item.count += 1;
        item.totalValue += price;
      } else {
        map.set(normalizedKey, {
          name: rawName,
          count: 1,
          totalValue: price,
        });
      }
    });

    const list = Array.from(map.values());

    // Compute totals
    const totalCollectionValue = list.reduce((acc, s) => acc + s.totalValue, 0);
    const totalCollectionCount = list.reduce((acc, s) => acc + s.count, 0);

    // Sort by chosen metric mode
    list.sort((a, b) => {
      if (metricMode === 'value') {
        if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue;
        return b.count - a.count;
      } else {
        if (b.count !== a.count) return b.count - a.count;
        return b.totalValue - a.totalValue;
      }
    });

    // Compute percentages
    const withPercentages = list.map((item, idx) => {
      const valuePct = totalCollectionValue > 0 ? (item.totalValue / totalCollectionValue) * 100 : 0;
      const countPct = totalCollectionCount > 0 ? (item.count / totalCollectionCount) * 100 : 0;
      const pct = metricMode === 'value' ? valuePct : countPct;
      const theme = PALETTE_THEMES[idx % PALETTE_THEMES.length];

      return {
        ...item,
        pct,
        valuePct,
        countPct,
        theme,
      };
    });

    return withPercentages;
  }, [figures, metricMode]);

  // Find max percentage to normalize bar widths so top series spans ~82% of width (matching screenshot)
  const maxPct = useMemo(() => {
    if (seriesData.length === 0) return 1;
    return Math.max(...seriesData.map((s) => s.pct)) || 1;
  }, [seriesData]);

  // Initial visible items count (6 items by default just like the screenshot)
  const INITIAL_VISIBLE = 6;
  const displayedSeries = isExpanded ? seriesData : seriesData.slice(0, INITIAL_VISIBLE);
  const hasMore = seriesData.length > INITIAL_VISIBLE;

  if (loading) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-xl animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-white/5 rounded" />
          <div className="h-6 w-24 bg-white/5 rounded-lg" />
        </div>
        <div className="space-y-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-2.5 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-white/5 rounded" />
                <div className="h-4 w-16 bg-white/5 rounded" />
              </div>
              <div className="h-2 w-3/4 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-bg-surface border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent-soft/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-accent-soft/10 text-accent-soft">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent-soft">
              Vault Analytics
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-text-main tracking-tight uppercase mt-0.5">
            Collection by Anime / Source Series
          </h3>
          <p className="text-[11px] text-text-muted font-medium">
            Distribution and portfolio share grouped by franchise ({seriesData.length} active {seriesData.length === 1 ? 'series' : 'series'}).
          </p>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex p-1 bg-bg-card border border-border-subtle rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setMetricMode('value')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                metricMode === 'value'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              Value
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                metricMode === 'count'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Hash className="w-3 h-3" />
              Count
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {seriesData.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 text-text-muted">
            <Tv className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-main">
            No Series Data Available
          </p>
          <p className="text-[11px] text-text-muted max-w-sm mt-1">
            Add figures with their source anime or series to see an automated breakdown of your collection.
          </p>
        </div>
      ) : (
        /* The List of Series Items - clean rows without series icon badges */
        <div className="divide-y divide-border-subtle/50">
          <AnimatePresence initial={false}>
            {displayedSeries.map((item, index) => {
              // Calculate proportional bar width normalized to highest category (max ~82%)
              const barNormalizedWidth = Math.max(
                (item.pct / (maxPct || 1)) * 82,
                1.5
              );

              // Value string formatting:
              const displayValue =
                metricMode === 'value'
                  ? item.totalValue.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })
                  : item.count.toLocaleString('en-US');

              const secondarySubtitle =
                metricMode === 'value'
                  ? `${item.count} ${item.count === 1 ? 'figure' : 'figures'}`
                  : formatCurrency(item.totalValue);

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors rounded-xl px-1 sm:px-2"
                >
                  {/* Top Row: Series Name on Left, Amount on Right */}
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-sm sm:text-base font-bold text-text-main truncate block tracking-tight">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 flex items-baseline gap-2">
                      <span className="text-[10px] text-text-muted font-medium hidden sm:inline">
                        {secondarySubtitle}
                      </span>
                      <span className="text-sm sm:text-base font-bold font-mono text-text-main tracking-tight">
                        {displayValue}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Proportional colored progress bar with percentage right at the tip */}
                  <div className="flex items-center gap-2.5 mt-1.5 w-full">
                    <div
                      className="h-2 sm:h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barNormalizedWidth}%`,
                        backgroundColor: item.theme.barColor,
                      }}
                    />
                    <span className="text-[11px] sm:text-xs font-mono text-text-muted shrink-0 font-medium select-none">
                      {item.pct.toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer / Expand Button if more than 6 series */}
      {hasMore && (
        <div className="pt-3 mt-1 border-t border-border-subtle/50 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-mono font-bold">
            Showing {displayedSeries.length} of {seriesData.length} series
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-soft hover:text-accent-primary transition-colors uppercase tracking-wider cursor-pointer py-1 px-2.5 rounded-lg hover:bg-accent-soft/10"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                View All {seriesData.length} Series <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </motion.section>
  );
}
