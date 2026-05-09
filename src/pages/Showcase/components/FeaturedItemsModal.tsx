import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { CheckCircle2, Package, Check } from 'lucide-react';
import { cn } from '../../../shared/utils/utils';

interface FeaturedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  figures: any[];
  featuredFigureIds: string[];
  setFeaturedFigureIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: (ids: string[]) => Promise<void>;
}

export function FeaturedItemsModal({
  isOpen,
  onClose,
  loading,
  figures,
  featuredFigureIds,
  setFeaturedFigureIds,
  onSave,
}: FeaturedItemsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Curate Featured Gallery"
      className="md:max-w-4xl"
      disabled={loading}
      footer={
        <button
          onClick={() => onSave(featuredFigureIds)}
          className="w-full h-14 bg-accent-soft text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-soft/20"
        >
          {loading ? <LoadingSpinner variant="white" /> : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Commit Featured Selection
            </>
          )}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="space-y-1 text-center sm:text-left">
             <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Select up to 9 Figures</h4>
             <p className="text-xs text-text-muted">These will represent your primary collection archive on your public profile.</p>
           </div>
           <div className="bg-bg-deep px-4 py-2 rounded-xl border border-border-subtle flex items-center gap-3">
              <div className="flex -space-x-1">
                 {[...Array(9)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-3 h-3 rounded-full border-2 border-bg-deep",
                        i < featuredFigureIds.length ? "bg-accent-primary" : "bg-border-subtle"
                      )} 
                    />
                 ))}
              </div>
              <span className="text-[10px] font-black text-text-main tabular-nums">{featuredFigureIds.length} / 9</span>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {figures.map((figure) => {
            const isSelected = featuredFigureIds.includes(figure.id);
            return (
              <button
                key={figure.id}
                onClick={() => {
                  if (isSelected) {
                    setFeaturedFigureIds(prev => prev.filter(id => id !== figure.id));
                  } else if (featuredFigureIds.length < 9) {
                    setFeaturedFigureIds(prev => [...prev, figure.id]);
                  }
                }}
                className={cn(
                  "aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group relative text-left",
                  isSelected ? "border-accent-primary" : "border-border-subtle hover:border-accent-primary/20"
                )}
              >
                {figure.imageUrls?.[0] ? (
                  <img src={figure.imageUrls[0]} className={cn("w-full h-full object-cover grayscale-[0.2] transition-all", isSelected ? "grayscale-0" : "group-hover:grayscale-0")} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-bg-surface flex items-center justify-center text-text-muted/20">
                     <Package className="w-8 h-8" />
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                   <p className="text-[9px] text-white font-black uppercase tracking-tight truncate">{figure.characterName}</p>
                   <p className="text-[7px] text-white/60 font-bold uppercase tracking-widest truncate">{figure.maker}</p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-accent-primary rounded-lg flex items-center justify-center text-white shadow-lg">
                     <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
