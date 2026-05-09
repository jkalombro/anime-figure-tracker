import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { Trash2, Shield } from 'lucide-react';

interface DeleteFigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  figureToDelete: any;
  onConfirm: () => Promise<void>;
}

export function DeleteFigureModal({ isOpen, onClose, loading, figureToDelete, onConfirm }: DeleteFigureModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Disposal"
      className="md:max-w-md"
      disabled={loading}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all disabled:opacity-30"
          >
            Abort
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner variant="white" /> : (
              <>
                <Trash2 className="w-4 h-4" />
                Dispose
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-text-main italic tracking-tighter">INITIATING DATA DISPOSAL</h3>
        <p className="text-text-muted text-sm leading-relaxed">
          Are you sure you want to remove <span className="text-text-main font-bold">"{figureToDelete?.characterName}"</span> from the catalog archive? This action cannot be reversed.
        </p>
      </div>
    </Modal>
  );
}
