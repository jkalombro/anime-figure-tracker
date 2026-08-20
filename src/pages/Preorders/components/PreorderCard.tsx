import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';

interface PreorderCardProps {
  key?: React.Key;
  preorder: any;
  onEdit?: (preorder: any) => void;
  onDelete?: (preorder: any) => void;
  onMarkReceived?: (preorder: any) => void;
  onViewGallery?: (images: string[]) => void;
  formatDateLong: (dateStr: string) => string;
  formatMonthYear: (monthStr: string) => string;
}

export function PreorderCard({
  preorder,
  onEdit,
  onDelete,
  onMarkReceived,
  onViewGallery,
  formatDateLong,
  formatMonthYear,
}: PreorderCardProps) {
  const abbreviateMaker = (maker: string) => {
    if (!maker) return '';
    const words = maker.trim().split(/\s+/);
    if (words.length > 1) {
      return words.map(word => word[0].toUpperCase()).join('');
    }
    return maker;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-sophisticated p-4 flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-4 sm:gap-x-8 items-start">
          <div className="order-1">
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0 leading-tight">
              <h3 className="font-bold text-text-main text-sm sm:text-base tracking-tight">
                {preorder.characterName || preorder.figureName}
              </h3>
              {preorder.maker && (
                <>
                  <span className="text-text-muted/30 font-normal shrink-0">•</span>
                  <span className="text-text-muted uppercase text-[9px] sm:text-[10px] font-black tracking-widest shrink-0" title={preorder.maker}>
                    {abbreviateMaker(preorder.maker)}
                  </span>
                </>
              )}
              {preorder.figureLine && (
                <>
                  <span className="text-text-muted/30 font-normal shrink-0">•</span>
                  <span className="text-accent-soft font-bold text-[10px] sm:text-xs">
                    {preorder.figureLine}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-text-muted italic leading-tight mt-0.5">
              {preorder.seller}
            </p>
            {!preorder.receivedAt ? (
              onMarkReceived ? (
                <button
                  onClick={() => onMarkReceived(preorder)}
                  className="mt-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-soft transition-colors flex items-center gap-1.5 w-fit bg-accent-primary/5 px-2 py-1 rounded-lg border border-accent-primary/10 hover:border-accent-primary/30"
                >
                  Mark as Received
                </button>
              ) : null
            ) : (
              <span className="mt-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-text-muted/50 flex items-center gap-1.5 grayscale">
                Received on {formatDateLong(preorder.receivedAt)}
              </span>
            )}
          </div>

          <div className="order-2 flex flex-col gap-2">
            <div>
              <span className="text-[9px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide block">
                Ordered: <span className="text-text-main">{formatDateLong(preorder.datePreordered)}</span>
              </span>
              <span className="text-[9px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide block">
                Arrival: <span className="text-text-main font-bold">
                  {preorder.estimatedArrivalFrom ? (
                    <>
                      {formatMonthYear(preorder.estimatedArrivalFrom)}
                      {preorder.estimatedArrivalTo && ` — ${formatMonthYear(preorder.estimatedArrivalTo)}`}
                    </>
                  ) : (
                    preorder.estimatedArrival
                  )}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 items-center border-t border-border-subtle/30 pt-2">
              <span className="text-[9px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide">
                Price: <span className="text-text-main font-bold">{formatCurrency(preorder.preorderPrice || 0)}</span>
              </span>
              <span className="text-[9px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide">
                DP: <span className="text-text-main font-bold">{formatCurrency(preorder.downpayment || 0)}</span>
              </span>
              <span className="text-[9px] sm:text-xs text-text-muted font-black uppercase tracking-wide">
                Balance: <span className="text-accent-soft">
                  {formatCurrency((preorder.preorderPrice || 0) - (preorder.downpayment || 0))}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {(onViewGallery || onEdit || onDelete) && (
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 shrink-0 sm:border-l border-border-subtle/50 self-stretch justify-center">
          {onViewGallery && (
            <button
              onClick={() => {
                if (preorder.imageUrls?.length > 0) {
                  onViewGallery(preorder.imageUrls);
                }
              }}
              disabled={!preorder.imageUrls || preorder.imageUrls.length === 0}
              className="p-1.5 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed group"
              title="View Gallery"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(preorder)}
              className="p-1.5 text-text-muted hover:text-accent-soft transition-colors group"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(preorder)}
              className="p-1.5 text-text-muted hover:text-red-400 transition-colors group"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
