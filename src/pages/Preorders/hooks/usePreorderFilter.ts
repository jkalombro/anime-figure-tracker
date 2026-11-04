import { useState, useEffect, useMemo } from 'react';
import { PreorderFilterType } from '../components/PreorderStatsCards';
import { PreorderSortField, SortOrder } from '../components/PreorderToolbar';

export function usePreorderFilter(preorders: any[], initialLoading: boolean = false) {
  const [activeFilter, setActiveFilter] = useState<PreorderFilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<PreorderSortField>('arrivalDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayedPreorders, setDisplayedPreorders] = useState<any[]>([]);

  const pendingPreorders = useMemo(() => {
    return preorders.filter(p => !p.receivedAt);
  }, [preorders]);

  const completedPreorders = useMemo(() => {
    return preorders.filter(p => !!p.receivedAt);
  }, [preorders]);

  const pendingAmountToPay = useMemo(() => {
    return pendingPreorders.reduce((sum, p) => {
      const price = Number(p.preorderPrice) || 0;
      const dp = Number(p.downpayment) || 0;
      return sum + (price - dp);
    }, 0);
  }, [pendingPreorders]);

  const completedTotalCost = useMemo(() => {
    return completedPreorders.reduce((sum, p) => {
      const price = Number(p.preorderPrice) || 0;
      return sum + price;
    }, 0);
  }, [completedPreorders]);

  // Debounced search and filtering matching Figures page behavior
  useEffect(() => {
    if (initialLoading) return;

    setIsFiltering(true);
    const timer = setTimeout(() => {
      const base = activeFilter === 'pending' ? pendingPreorders : completedPreorders;
      const searchLower = searchQuery.toLowerCase().trim();

      const results = base
        .filter((p) => {
          if (!searchLower) return true;
          const character = (p.characterName || p.figureName || '').toLowerCase();
          const series = (p.sourceAnime || '').toLowerCase();
          const maker = (p.maker || '').toLowerCase();
          const shop = (p.seller || '').toLowerCase();
          const line = (p.figureLine || '').toLowerCase();
          return (
            character.includes(searchLower) ||
            series.includes(searchLower) ||
            maker.includes(searchLower) ||
            shop.includes(searchLower) ||
            line.includes(searchLower)
          );
        })
        .sort((a, b) => {
          if (sortField === 'arrivalDate') {
            const aDate = a.estimatedArrivalFrom || a.estimatedArrival || (a.receivedAt ? a.receivedAt.substring(0, 7) : '');
            const bDate = b.estimatedArrivalFrom || b.estimatedArrival || (b.receivedAt ? b.receivedAt.substring(0, 7) : '');
            if (!aDate && bDate) return 1;
            if (aDate && !bDate) return -1;
            if (!aDate && !bDate) return 0;
            return sortOrder === 'asc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
          }
          if (sortField === 'shop') {
            const aShop = (a.seller || '').toLowerCase();
            const bShop = (b.seller || '').toLowerCase();
            if (aShop < bShop) return sortOrder === 'asc' ? -1 : 1;
            if (aShop > bShop) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          }
          if (sortField === 'price') {
            const aPrice = Number(a.preorderPrice) || 0;
            const bPrice = Number(b.preorderPrice) || 0;
            return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
          }
          if (sortField === 'sourceSeries') {
            const aSeries = (a.sourceAnime || '').toLowerCase();
            const bSeries = (b.sourceAnime || '').toLowerCase();
            if (aSeries < bSeries) return sortOrder === 'asc' ? -1 : 1;
            if (aSeries > bSeries) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          }
          return 0;
        });

      setDisplayedPreorders(results);
      setIsFiltering(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [activeFilter, pendingPreorders, completedPreorders, searchQuery, sortField, sortOrder, initialLoading]);

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return {
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    isFiltering,
    pendingPreorders,
    completedPreorders,
    pendingAmountToPay,
    completedTotalCost,
    displayedPreorders,
  };
}
