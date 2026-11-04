import React, { useState } from 'react';
import { Search, ChevronDown, X, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';
import { cn } from '../../../shared/utils/utils';

export type PreorderSortField = 'arrivalDate' | 'shop' | 'price' | 'sourceSeries';
export type SortOrder = 'asc' | 'desc';

interface PreorderToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: PreorderSortField;
  onSortFieldChange: (field: PreorderSortField) => void;
  sortOrder: SortOrder;
  onSortOrderToggle: () => void;
}

export function PreorderToolbar({
  searchQuery,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderToggle,
}: PreorderToolbarProps) {
  const [showSortControls, setShowSortControls] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search characters, series, shops..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl pl-11 pr-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-deep rounded-full transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5 text-text-muted" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowSortControls(!showSortControls)}
          className="md:hidden h-12 w-12 flex items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl text-text-muted hover:text-accent-primary transition-colors shrink-0"
          title="Toggle sort options"
        >
          <ListFilter className={cn('w-5 h-5 transition-transform', showSortControls && 'rotate-180')} />
        </button>
      </div>

      <div
        className={cn(
          'flex items-center gap-2 w-full md:w-auto transition-all overflow-hidden',
          !showSortControls && 'max-md:h-0 max-md:opacity-0 max-md:pointer-events-none'
        )}
      >
        <div className="relative flex-1 md:w-48">
          <select
            value={sortField}
            onChange={(e) => onSortFieldChange(e.target.value as PreorderSortField)}
            className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer pr-10 font-bold"
          >
            <option value="arrivalDate">Arrival Date</option>
            <option value="shop">Shop</option>
            <option value="price">Price</option>
            <option value="sourceSeries">Source Series</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        <button
          onClick={onSortOrderToggle}
          className="h-12 w-12 flex items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl text-text-muted hover:text-accent-primary transition-colors shrink-0"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortOrder === 'asc' ? (
            <ArrowUp className="w-4 h-4 text-accent-primary" />
          ) : (
            <ArrowDown className="w-4 h-4 text-accent-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
