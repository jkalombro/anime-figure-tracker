import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, Image as ImageIcon, Gift } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';

interface FigureCardProps {
  key?: React.Key;
  figure: any;
  onEdit: (figure: any) => void;
  onDelete: (figure: any) => void;
  onViewGallery: (images: string[]) => void;
  abbreviateMaker: (maker: string) => string;
}

export function FigureCard({ figure, onEdit, onDelete, onViewGallery, abbreviateMaker }: FigureCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-sophisticated p-4 sm:px-6 sm:py-4 relative overflow-hidden"
    >
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_140px] gap-x-4 sm:gap-x-12 gap-y-3 sm:gap-y-1 items-center">
        {/* Figure Info Column - Row 1, Col 1 on Mobile. Row 1-2, Col 1 on Desktop */}
        <div className="min-w-0 sm:row-span-2 space-y-0">
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0 leading-tight">
            <h3 className="font-bold text-text-main text-sm sm:text-base tracking-tight">
              {figure.characterName}
            </h3>
            <span className="text-text-muted/30 font-normal shrink-0">•</span>
            <span className="text-text-muted uppercase text-[9px] sm:text-[10px] font-black tracking-widest shrink-0" title={figure.maker}>
              {abbreviateMaker(figure.maker)}
            </span>
            {figure.figureLine && (
              <>
                <span className="text-text-muted/30 font-normal shrink-0">•</span>
                <span className="text-accent-soft font-bold text-[10px] sm:text-xs">
                  {figure.figureLine}
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-text-muted italic leading-tight mt-0.5">
            {figure.sourceAnime}
          </p>
        </div>

        {/* Action Icons Column - Row 1, Col 2 on Mobile. Row 1-2, Col 3 on Desktop */}
        <div className="flex sm:flex-row items-center justify-end sm:justify-center gap-0.5 sm:gap-2 sm:row-span-2 sm:col-start-3 sm:border-l border-border-subtle/50 sm:pl-8 sm:py-1 self-stretch">
          <button
            onClick={() => {
              if (figure.imageUrls?.length > 0) {
                onViewGallery(figure.imageUrls);
              }
            }}
            disabled={!figure.imageUrls || figure.imageUrls.length === 0}
            className="p-1 sm:p-1 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed group"
            title="View Gallery"
          >
            <ImageIcon className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => onEdit(figure)}
            className="p-1 sm:p-1 text-text-muted hover:text-accent-soft transition-colors group"
            title="Edit"
          >
            <Edit2 className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => onDelete(figure)}
            className="p-1 sm:p-1 text-text-muted hover:text-red-400 transition-colors group"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Tags Column - Row 2, Col 1 on Mobile. Row 1, Col 2 on Desktop */}
        <div className="flex items-center min-h-[20px] sm:col-start-2 sm:row-start-1 sm:justify-start py-1 sm:py-0">
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {figure.isGifted ? (
              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded border border-amber-500/20 flex items-center gap-1">
                <Gift className="w-2.5 h-2.5" />
                Gift
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded border border-blue-500/20">
                Purchased: {figure.condition || 'MSIB'}
              </span>
            )}
            {figure.isSold && (
              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded border border-green-500/20">
                Sold
              </span>
            )}
            {figure.isLost && (
              <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded border border-red-500/20">
                Lost
              </span>
            )}
          </div>
        </div>

        {/* Price Column - Row 2, Col 2 on Mobile. Row 2, Col 2 on Desktop */}
        <div className="flex justify-end items-center sm:col-start-2 sm:row-start-2">
          <div className="flex justify-between items-center w-full gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
            <span className="text-text-muted/40 font-black">Price:</span>
            <span className="text-text-main font-black tabular-nums">{formatCurrency(figure.totalPrice)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
