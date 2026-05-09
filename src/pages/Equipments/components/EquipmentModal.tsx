import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { UseFormReturn } from 'react-hook-form';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEquipment: any;
  loading: boolean;
  formMethods: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
}

export function EquipmentModal({
  isOpen,
  onClose,
  editingEquipment,
  loading,
  formMethods,
  onSubmit,
}: EquipmentModalProps) {
  const { register, handleSubmit, formState: { isValid } } = formMethods;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disabled={loading}
      title={editingEquipment ? "Modify Gear" : "Equip Gallery"}
      footer={
        <button
          disabled={loading || !isValid}
          form="equipment-form"
          type="submit"
          className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner variant="white" /> : 'Confirm Gear'}
        </button>
      }
    >
      <form id="equipment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={loading} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Description</label>
            <input
              {...register('description', { required: true })}
              autoComplete="off"
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-text-main outline-none focus:ring-1 focus:ring-accent-primary"
              placeholder="e.g. Detolf Glass Cabinet"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Total Price</label>
            <input
              type="number" step="0.01"
              {...register('totalPrice', { required: true })}
              autoComplete="off"
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-text-main outline-none focus:ring-1 focus:ring-accent-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
              placeholder="0.00"
            />
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
