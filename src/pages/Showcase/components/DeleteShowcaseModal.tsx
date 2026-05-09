import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { Trash2 } from 'lucide-react';

interface DeleteShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteShowcaseModal({
  isOpen,
  onClose,
  loading,
  onConfirm,
}: DeleteShowcaseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Disposal"
      className="md:max-w-md"
      disabled={loading}
      footer={
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all"
          >
            Abort
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
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
      <p className="text-text-muted text-sm text-center">Are you sure you want to permanently dispose of this exhibition? This action cannot be reversed.</p>
    </Modal>
  );
}
