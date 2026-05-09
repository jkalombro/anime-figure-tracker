import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { Plus, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface PreorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPreorder: any;
  loading: boolean;
  formMethods: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  imageItems: { url: string; file?: File }[];
  setImageItems: React.Dispatch<React.SetStateAction<{ url: string; file?: File }[]>>;
}

export function PreorderModal({
  isOpen,
  onClose,
  editingPreorder,
  loading,
  formMethods,
  onSubmit,
  imageItems,
  setImageItems,
}: PreorderModalProps) {
  const { register, handleSubmit, formState: { isValid } } = formMethods;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPreorder ? "Update Pipeline" : "Log New Preorder"}
      className="md:max-w-xl"
      disabled={loading}
      footer={
        <button
          disabled={loading || !isValid}
          form="preorder-form"
          type="submit"
          className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner variant="white" /> : (editingPreorder ? 'Update Pipeline' : 'Lock in Preorder')}
        </button>
      }
    >
      <form id="preorder-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={loading} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
              Target Item
            </label>
            <input
              {...register('figureName', { required: true })}
              autoComplete="off"
              className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
              placeholder="Figure Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                Provider
              </label>
              <input
                {...register('seller', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
                placeholder="Shop Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                Ordered On
              </label>
              <input
                type="date"
                {...register('datePreordered', { required: true })}
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                Preorder Price
              </label>
              <input
                type="number"
                step="0.01"
                {...register('preorderPrice', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all font-bold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                Downpayment
              </label>
              <input
                type="number"
                step="0.01"
                {...register('downpayment', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all font-bold"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                Arrival (From)
              </label>
              <input
                type="month"
                {...register('estimatedArrivalFrom', { required: true })}
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                Arrival (To) — Optional
              </label>
              <input
                type="month"
                {...register('estimatedArrivalTo', {
                  validate: (value, formValues) => {
                    if (!value) return true;
                    return value > formValues.estimatedArrivalFrom || 'Must be at least 1 month ahead';
                  },
                })}
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
              References (up to 3)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {imageItems.map((item, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg border border-border-subtle bg-bg-surface relative group overflow-hidden"
                >
                  <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageItems((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imageItems.length < 3 && (
                <div className="aspect-square rounded-lg border-2 border-dashed border-border-subtle flex items-center justify-center text-text-muted relative hover:border-accent-primary transition-colors bg-bg-surface">
                  <Plus className="w-4 h-4" />
                  <input
                    type="file"
                    multiple
                    {...register('images')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                </div>
              )}
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
