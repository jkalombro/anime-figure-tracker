import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { Plus, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '../../../shared/utils/utils';

interface PreorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPreorder: any;
  loading: boolean;
  formMethods: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  imageItems: { url: string; file?: File }[];
  setImageItems: React.Dispatch<React.SetStateAction<{ url: string; file?: File }[]>>;
  watchedAnime: string;
  watchedMaker: string;
  animeSuggestions: string[];
  makersSuggestions: string[];
  showAnimeSuggestions: boolean;
  showMakerSuggestions: boolean;
  setShowAnimeSuggestions: (show: boolean) => void;
  setShowMakerSuggestions: (show: boolean) => void;
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
  watchedAnime,
  watchedMaker,
  animeSuggestions,
  makersSuggestions,
  showAnimeSuggestions,
  showMakerSuggestions,
  setShowAnimeSuggestions,
  setShowMakerSuggestions,
}: PreorderModalProps) {
  const { register, handleSubmit, setValue, formState: { isValid } } = formMethods;
  const [activeIndexAnime, setActiveIndexAnime] = React.useState(0);
  const [activeIndexMaker, setActiveIndexMaker] = React.useState(0);

  const filteredAnime = animeSuggestions
    .filter(a => a.toLowerCase().includes((watchedAnime || '').toLowerCase()))
    .filter(a => a.toLowerCase() !== (watchedAnime || '').toLowerCase())
    .slice(0, 5);

  const filteredMakers = makersSuggestions
    .filter(m => m.toLowerCase().includes((watchedMaker || '').toLowerCase()))
    .filter(m => m.toLowerCase() !== (watchedMaker || '').toLowerCase())
    .slice(0, 5);

  React.useEffect(() => {
    setActiveIndexAnime(0);
  }, [watchedAnime]);

  React.useEffect(() => {
    setActiveIndexMaker(0);
  }, [watchedMaker]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPreorder ? "Update Pipeline" : "Log New Preorder"}
      className="md:max-w-2xl"
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
      <form id="preorder-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={loading} className="space-y-6">
          {/* Character Name */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Character Name</label>
            <input
              {...register('characterName', { required: true })}
              autoComplete="off"
              className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
              placeholder="e.g. Uchiha Itachi"
            />
          </div>

          {/* Source Series */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Source Series</label>
            <div className="relative">
              <input
                {...register('sourceAnime', { required: true })}
                autoComplete="off"
                onFocus={() => setShowAnimeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowAnimeSuggestions(false), 200)}
                onChange={(e) => {
                  register('sourceAnime').onChange(e);
                  setShowAnimeSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (showAnimeSuggestions && filteredAnime.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveIndexAnime(prev => (prev + 1) % filteredAnime.length);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveIndexAnime(prev => (prev - 1 + filteredAnime.length) % filteredAnime.length);
                    } else if (e.key === 'Tab' || e.key === 'Enter') {
                      e.preventDefault();
                      setValue('sourceAnime', filteredAnime[activeIndexAnime], { shouldValidate: true });
                      setShowAnimeSuggestions(false);
                    }
                  }
                }}
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                placeholder="e.g. Naruto Shippuden"
              />
              {showAnimeSuggestions && watchedAnime && filteredAnime.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
                  {filteredAnime.map((a, i) => (
                    <button 
                      key={`${a}-${i}`} 
                      type="button" 
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndexAnime(i)}
                      onClick={() => {
                        setValue('sourceAnime', a, { shouldValidate: true });
                        setShowAnimeSuggestions(false);
                      }} 
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm font-bold transition-colors",
                        i === activeIndexAnime ? "bg-accent-primary text-white" : "hover:bg-accent-primary hover:text-white"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Maker and Line Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maker */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Product Line/Series</label>
              <div className="relative">
                <input
                  {...register('maker', { required: true })}
                  autoComplete="off"
                  onFocus={() => setShowMakerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowMakerSuggestions(false), 200)}
                  onChange={(e) => {
                    register('maker').onChange(e);
                    setShowMakerSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (showMakerSuggestions && filteredMakers.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveIndexMaker(prev => (prev + 1) % filteredMakers.length);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveIndexMaker(prev => (prev - 1 + filteredMakers.length) % filteredMakers.length);
                      } else if (e.key === 'Tab' || e.key === 'Enter') {
                        e.preventDefault();
                        setValue('maker', filteredMakers[activeIndexMaker], { shouldValidate: true });
                        setShowMakerSuggestions(false);
                      }
                    }
                  }}
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                  placeholder="e.g. Ichiban Kuji"
                />
                {showMakerSuggestions && watchedMaker && filteredMakers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
                    {filteredMakers.map((m, i) => (
                      <button 
                        key={`${m}-${i}`} 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActiveIndexMaker(i)}
                        onClick={() => {
                          setValue('maker', m, { shouldValidate: true });
                          setShowMakerSuggestions(false);
                        }} 
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm font-bold transition-colors",
                          i === activeIndexMaker ? "bg-accent-primary text-white" : "hover:bg-accent-primary hover:text-white"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Line */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Set/Scale (optional)</label>
              <input
                {...register('figureLine')}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                placeholder="e.g. Ultra Impact"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Provider
              </label>
              <input
                {...register('seller', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                placeholder="Shop Name"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Ordered On
              </label>
              <input
                type="date"
                {...register('datePreordered', { required: true })}
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Preorder Price
              </label>
              <input
                type="number"
                step="0.01"
                {...register('preorderPrice', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Downpayment
              </label>
              <input
                type="number"
                step="0.01"
                {...register('downpayment', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Arrival (From)
              </label>
              <input
                type="month"
                {...register('estimatedArrivalFrom', { required: true })}
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
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
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
              References (up to 3)
            </label>
            <div className="grid grid-cols-3 gap-3 mb-2">
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
                  <Plus className="w-5 h-5" />
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
