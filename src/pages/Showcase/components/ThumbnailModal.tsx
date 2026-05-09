import { Modal } from '../../../shared/components/Modal';
import { Check } from 'lucide-react';
import { cn } from '../../../shared/utils/utils';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  activeShowcase: any;
  onUpdateThumbnail: (url: string) => Promise<void>;
}

export function ThumbnailModal({
  isOpen,
  onClose,
  loading,
  activeShowcase,
  onUpdateThumbnail,
}: ThumbnailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exhibition Identity"
      className="md:max-w-lg"
      disabled={loading}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Select Thumbnail</h4>
          <p className="text-xs text-text-muted">Choose the primary visual representation for <span className="text-text-main font-black italic">{activeShowcase?.name}</span>.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {activeShowcase?.imageUrls?.map((url: string, i: number) => {
            const isSelected = activeShowcase.thumbnailUrl === url;
            return (
              <button
                key={i}
                disabled={loading}
                onClick={() => onUpdateThumbnail(url)}
                className={cn(
                  "aspect-video rounded-2xl overflow-hidden border-2 transition-all group relative",
                  isSelected ? "border-accent-primary" : "border-border-subtle hover:border-accent-primary/30"
                )}
              >
                <img src={url} className={cn("w-full h-full object-cover grayscale-[0.2] transition-all", isSelected ? "grayscale-0" : "group-hover:grayscale-0")} referrerPolicy="no-referrer" />
                {isSelected && (
                  <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                     <Check className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 py-3 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-[8px] text-white font-black uppercase tracking-widest text-center">Choose perspective {i + 1}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
