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
      className="card-sophisticated py-3 px-4 sm:px-6 sm:py-5 flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0 text-left">
            {/* First Row */}
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-bold text-text-main text-sm sm:text-base tracking-tight leading-tight">
                <span>{figure.characterName}</span>
                <span className="mx-2 text-text-muted/30 font-normal">•</span>
                <span className="text-text-muted uppercase text-[8px] sm:text-xs font-black tracking-widest" title={figure.maker}>{abbreviateMaker(figure.maker)}</span>
                {figure.figureLine && (
                  <>
                    <span className="mx-2 text-text-muted/30 font-normal">•</span>
                    <span className="text-accent-soft font-bold text-[10px] sm:text-sm whitespace-nowrap">
                      {figure.figureLine}
                    </span>
                  </>
                )}
              </h3>
            </div>

            {/* Second Row - Maintains current content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 items-baseline">
              <p className="text-xs sm:text-sm text-text-muted italic truncate">
                {figure.sourceAnime}
              </p>

              <div className="flex w-full max-w-[300px]">
                <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                  Price: <span className="text-text-main font-bold">{formatCurrency(figure.totalPrice)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-2 px-1 sm:px-4 shrink-0 sm:border-l border-border-subtle/50 self-stretch justify-center">
          <button
            onClick={() => {
              if (figure.imageUrls?.length > 0) {
                onViewGallery(figure.imageUrls);
              }
            }}
            disabled={!figure.imageUrls || figure.imageUrls.length === 0}
            className="p-1 sm:p-1.5 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
            title="View Gallery"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onEdit(figure)}
            className="p-1 sm:p-1.5 text-text-muted hover:text-accent-soft transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onDelete(figure)}
            className="p-1 sm:p-1.5 text-text-muted hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Tags Row */}
      {(figure.isGifted || figure.isSold || figure.isLost) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle/10 text-left">
          {figure.isGifted && (
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-500/20 flex items-center gap-1">
              <Gift className="w-2.5 h-2.5" />
              Gift
            </span>
          )}
          {figure.isSold && (
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-green-500/20">
              Sold
            </span>
          )}
          {figure.isLost && (
            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-red-500/20">
              Lost
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
