import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';

interface PreorderCardProps {
  key?: React.Key;
  preorder: any;
  onEdit: (preorder: any) => void;
  onDelete: (preorder: any) => void;
  onMarkReceived: (preorder: any) => void;
  onViewGallery: (images: string[]) => void;
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
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text-main truncate text-sm sm:text-base tracking-tight">
                {preorder.figureName}
              </h3>
              {preorder.receivedAt && (
                <span className="text-[8px] sm:text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wider h-fit">
                  RECEIVED
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text-muted italic truncate leading-tight">
              {preorder.seller}
            </p>
            {!preorder.receivedAt ? (
              <button
                onClick={() => onMarkReceived(preorder)}
                className="mt-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-soft transition-colors flex items-center gap-1.5 w-fit bg-accent-primary/5 px-2 py-1 rounded-lg border border-accent-primary/10 hover:border-accent-primary/30"
              >
                Mark as Received
              </button>
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

      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 shrink-0 sm:border-l border-border-subtle/50 self-stretch justify-center">
        <button
          onClick={() => {
            if (preorder.imageUrls?.length > 0) {
              onViewGallery(preorder.imageUrls);
            }
          }}
          disabled={!preorder.imageUrls || preorder.imageUrls.length === 0}
          className="p-1.5 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
          title="View Gallery"
        >
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => onEdit(preorder)}
          className="p-1.5 text-text-muted hover:text-accent-soft transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => onDelete(preorder)}
          className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}
