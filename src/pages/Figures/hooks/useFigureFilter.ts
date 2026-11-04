import { useState, useEffect, useMemo } from 'react';
import { FigureFilterType } from '../components/FigureStatsCards';
import { FigureSortField, SortOrder } from '../components/FigureToolbar';

export function useFigureFilter(figures: any[], initialLoading: boolean) {
  const [activeFilter, setActiveFilter] = useState<FigureFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<FigureSortField>('totalPrice');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayFigures, setDisplayFigures] = useState<any[]>([]);

  // Metric Computations
  const totalBasePrice = useMemo(() => {
    return figures.filter(f => !f.isSold).reduce((sum, f) => sum + (f.totalPrice || 0), 0);
  }, [figures]);

  const purchasedBasePrice = useMemo(() => {
    return figures.filter(f => !f.isGifted && !f.isSold).reduce((sum, f) => sum + (f.totalPrice || 0), 0);
  }, [figures]);

  const giftsBasePrice = useMemo(() => {
    return figures.filter(f => f.isGifted && !f.isSold).reduce((sum, f) => sum + (f.totalPrice || 0), 0);
  }, [figures]);

  const totalFiguresCount = useMemo(() => {
    return figures.filter(f => !f.isSold).length;
  }, [figures]);

  const totalPurchasedCount = useMemo(() => {
    return figures.filter(f => !f.isGifted && !f.isSold).length;
  }, [figures]);

  const totalGiftsCount = useMemo(() => {
    return figures.filter(f => f.isGifted && !f.isSold).length;
  }, [figures]);

  // Debounced search and filtering
  useEffect(() => {
    if (initialLoading) return;

    setIsFiltering(true);
    const timer = setTimeout(() => {
      const results = figures
        .filter(figure => {
          if (activeFilter === 'gifted' && !figure.isGifted) return false;
          if (activeFilter === 'purchased' && figure.isGifted) return false;

          const searchLower = searchQuery.toLowerCase();
          return (
            figure.characterName.toLowerCase().includes(searchLower) ||
            figure.sourceAnime.toLowerCase().includes(searchLower) ||
            figure.maker.toLowerCase().includes(searchLower) ||
            (figure.figureLine && figure.figureLine.toLowerCase().includes(searchLower))
          );
        })
        .sort((a, b) => {
          let valA = a[sortField] ?? '';
          let valB = b[sortField] ?? '';

          if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
          }

          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

      setDisplayFigures(results);
      setIsFiltering(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [figures, activeFilter, searchQuery, sortField, sortOrder, initialLoading]);

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
    displayFigures,
    totalBasePrice,
    purchasedBasePrice,
    giftsBasePrice,
    totalFiguresCount,
    totalPurchasedCount,
    totalGiftsCount,
  };
}
