import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { Save, X, Camera } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface ShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingShowcase: any;
  loading: boolean;
  formMethods: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  imageItems: { url: string; file?: File }[];
  setImageItems: React.Dispatch<React.SetStateAction<{ url: string; file?: File }[]>>;
}

export function ShowcaseModal({
  isOpen,
  onClose,
  editingShowcase,
  loading,
  formMethods,
  onSubmit,
  imageItems,
  setImageItems,
}: ShowcaseModalProps) {
  const { register, handleSubmit, formState: { isValid } } = formMethods;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingShowcase ? "Update Exhibition" : "New Showcase Archive"}
      className="md:max-w-2xl"
      disabled={loading}
      footer={
        <button
          disabled={loading || !isValid}
          form="showcase-form"
          type="submit"
          className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30"
        >
          {loading ? <LoadingSpinner variant="white" /> : (
            <>
              <Save className="w-4 h-4" />
              {editingShowcase ? 'Sync Changes' : 'Publish Showcase'}
            </>
          )}
        </button>
      }
    >
      <form id="showcase-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Exhibition Name</label>
          <input
            {...register('name', { required: true })}
            className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
            placeholder="e.g. My Shonen Grails"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Description</label>
          <textarea
            {...register('description', { required: true })}
            rows={4}
            className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm resize-none"
            placeholder="Tell the community about this collection..."
          />
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Gallery Images (Up to 3)</label>
          <div className="grid grid-cols-3 gap-3">
            {imageItems.map((item, i) => (
              <div key={i} className="aspect-video sm:aspect-square rounded-lg overflow-hidden border border-border-subtle bg-bg-surface relative group">
                <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => {
                      setImageItems(prev => prev.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imageItems.length < 3 && (
              <div className="aspect-video sm:aspect-square rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted relative hover:border-accent-primary transition-colors bg-bg-surface">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Upload Image</span>
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
      </form>
    </Modal>
  );
}
