import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import {
  formatCurrency,
  formatDateLong as defaultFormatDateLong,
  formatMonthYear as defaultFormatMonthYear,
  abbreviateMaker as defaultAbbreviateMaker,
} from '../../../shared/utils/utils';

export interface PreorderItem {
  id: string;
  characterName?: string;
  figureName?: string;
  sourceAnime?: string;
  maker?: string;
  figureLine?: string;
  seller?: string;
  datePreordered: string;
  estimatedArrivalFrom?: string;
  estimatedArrivalTo?: string;
  estimatedArrival?: string;
  preorderPrice?: number | null;
  downpayment?: number | null;
  imageUrls?: string[];
  receivedAt?: string | null;
  [key: string]: any;
}

export interface PreorderCardProps {
  key?: React.Key;
  preorder: PreorderItem;
  onEdit?: (preorder: PreorderItem) => void;
  onDelete?: (preorder: PreorderItem) => void;
  onMarkReceived?: (preorder: PreorderItem) => void;
  onViewGallery?: (images: string[]) => void;
  formatDateLong?: (dateStr: string) => string;
  formatMonthYear?: (monthStr: string) => string;
}

export function PreorderCard({
  preorder,
  onEdit,
  onDelete,
  onMarkReceived,
  onViewGallery,
  formatDateLong = defaultFormatDateLong,
  formatMonthYear = defaultFormatMonthYear,
}: PreorderCardProps) {
  const hasImages = preorder.imageUrls && preorder.imageUrls.length > 0;
  const balance = (preorder.preorderPrice || 0) - (preorder.downpayment || 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-sophisticated p-4 flex items-center justify-between gap-4 group/card hover:border-accent-primary/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-4 sm:gap-x-8 items-start">
          <div className="order-1 min-w-0">
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0 leading-tight">
              <h3 className="font-bold text-text-main text-sm sm:text-base tracking-tight truncate max-w-full">
                {preorder.characterName || preorder.figureName}
              </h3>
              {preorder.maker && (
                <>
                  <span className="text-text-muted/30 font-normal shrink-0">•</span>
                  <span
                    className="text-text-muted uppercase text-[9px] sm:text-[10px] font-black tracking-widest shrink-0"
                    title={preorder.maker}
                  >
                    {defaultAbbreviateMaker(preorder.maker)}
                  </span>
                </>
              )}
              {preorder.figureLine && (
                <>
                  <span className="text-text-muted/30 font-normal shrink-0">•</span>
                  <span className="text-accent-soft font-bold text-[10px] sm:text-xs shrink-0">
                    {preorder.figureLine}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-text-muted italic leading-tight mt-0.5 truncate">
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

          <div className="order-2 flex flex-col gap-2 w-full">
            <div>
              <span className="text-[9px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide block truncate">
                Ordered: <span className="text-text-main">{formatDateLong(preorder.datePreordered)}</span>
              </span>
              <span className="text-[9px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide block truncate">
                Arrival:{' '}
                <span className="text-text-main font-bold">
                  {preorder.estimatedArrivalFrom ? (
                    <>
                      {formatMonthYear(preorder.estimatedArrivalFrom)}
                      {preorder.estimatedArrivalTo && ` — ${formatMonthYear(preorder.estimatedArrivalTo)}`}
                    </>
                  ) : (
                    preorder.estimatedArrival || 'TBD'
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
                Balance: <span className="text-accent-soft">{formatCurrency(balance)}</span>
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
                if (hasImages && preorder.imageUrls) {
                  onViewGallery(preorder.imageUrls);
                }
              }}
              disabled={!hasImages}
              className="p-1.5 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed group/btn"
              title="View Gallery"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(preorder)}
              className="p-1.5 text-text-muted hover:text-accent-soft transition-colors group/btn"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(preorder)}
              className="p-1.5 text-text-muted hover:text-red-400 transition-colors group/btn"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
