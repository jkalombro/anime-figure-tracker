import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { Box } from 'lucide-react';

interface MarkReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  preorderToMark: any;
  receivedDate: string;
  setReceivedDate: (date: string) => void;
  onConfirm: () => Promise<void>;
  status?: string;
}

export function MarkReceivedModal({
  isOpen,
  onClose,
  loading,
  preorderToMark,
  receivedDate,
  setReceivedDate,
  onConfirm,
  status,
}: MarkReceivedModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Inventory Update"
      className="md:max-w-md"
      disabled={loading}
      footer={
        <div className="flex gap-3">
          {!status && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all disabled:opacity-30"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={loading || !!status?.includes('Successfully')}
            className={`flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
              status?.includes('Successfully') 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20 cursor-default'
                : 'bg-accent-primary text-white hover:bg-accent-soft shadow-accent-primary/20 disabled:opacity-30'
            }`}
          >
            {loading ? <LoadingSpinner variant="white" /> : status?.includes('Successfully') ? 'Success' : 'Confirm Check-in'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 ${status?.includes('Successfully') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent-primary/10 text-accent-primary'} rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500`}>
            {status?.includes('Successfully') ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <Box className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-xl font-bold text-text-main italic tracking-tighter uppercase">
            {status ? 'Transmission' : 'Cargo Arrival'}
          </h3>
          <p className="text-text-muted text-sm leading-relaxed mt-2">
            {status || (
              <>Logging <span className="text-text-main font-bold">"{preorderToMark?.figureName || preorderToMark?.characterName}"</span> into the permanent collection.</>
            )}
          </p>
        </div>

        {!status && (
          <div className="bg-bg-card p-4 rounded-2xl border border-border-subtle">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
              Date Received
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all font-bold"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
