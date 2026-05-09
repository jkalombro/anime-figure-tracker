import { motion } from 'motion/react';
import { Shield, X, Plus } from 'lucide-react';
import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { cn } from '../../../shared/utils/utils';
import { UseFormReturn } from 'react-hook-form';

interface FigureForm {
  characterName: string;
  maker: string;
  figureLine: string;
  totalPrice: number | null;
  condition: 'MSIB' | 'MIB' | 'BIB' | 'LOOSE' | 'PRE-ORDERED';
  sourceAnime: string;
  seasonArc?: string;
  images?: FileList;
  isGifted: boolean;
  isSold: boolean;
  isLost: boolean;
  description?: string;
}

interface FigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFigure: any;
  loading: boolean;
  formMethods: UseFormReturn<FigureForm>;
  onSubmit: (data: FigureForm) => Promise<void>;
  watchedIsSold: boolean;
  watchedIsLost: boolean;
  watchedAnime: string;
  watchedMaker: string;
  animeSuggestions: string[];
  makersSuggestions: string[];
  showAnimeSuggestions: boolean;
  showMakerSuggestions: boolean;
  setShowAnimeSuggestions: (show: boolean) => void;
  setShowMakerSuggestions: (show: boolean) => void;
  imageItems: { url: string; file?: File }[];
  setImageItems: React.Dispatch<React.SetStateAction<{ url: string; file?: File }[]>>;
}

export function FigureModal({
  isOpen,
  onClose,
  editingFigure,
  loading,
  formMethods,
  onSubmit,
  watchedIsSold,
  watchedIsLost,
  watchedAnime,
  watchedMaker,
  animeSuggestions,
  makersSuggestions,
  showAnimeSuggestions,
  showMakerSuggestions,
  setShowAnimeSuggestions,
  setShowMakerSuggestions,
  imageItems,
  setImageItems
}: FigureModalProps) {
  const { register, handleSubmit, setValue, watch, formState: { isValid } } = formMethods;
  const watchedIsGifted = watch('isGifted');
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
      title={editingFigure ? "Update Details" : "Record New Action Figure"}
      className="md:max-w-2xl"
      disabled={loading}
      footer={
        <motion.button
          whileHover={{ scale: (isValid && !loading) ? 1.01 : 1 }}
          whileTap={{ scale: (isValid && !loading) ? 0.99 : 1 }}
          disabled={loading || !isValid}
          form="figure-form"
          type="submit"
          className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner variant="white" /> : (
            <>
              <Shield className="w-4 h-4" />
              {editingFigure ? 'Update Details' : 'Save details'}
            </>
          )}
        </motion.button>
      }
    >
      <form id="figure-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={loading} className="space-y-6">
          {editingFigure && (
            <div className="space-y-4 bg-bg-deep/50 p-4 rounded-xl border border-border-subtle/50">
              <div className="flex items-start sm:items-center gap-3">
                <input
                  type="checkbox"
                  id="isSold-top"
                  {...register('isSold')}
                  disabled={watchedIsLost}
                  className="w-5 h-5 mt-0.5 sm:mt-0 rounded border-border-subtle text-accent-primary focus:ring-accent-primary bg-bg-card shrink-0 disabled:opacity-30"
                />
                <label htmlFor="isSold-top" className={cn("text-sm font-bold text-text-main cursor-pointer select-none leading-tight", watchedIsLost && "opacity-30 cursor-not-allowed")}>
                  Mark as Sold
                  <span className="block sm:inline sm:ml-2 text-[10px] text-text-muted font-medium normal-case tracking-normal">
                    Check this if you have already sold this figure
                  </span>
                </label>
              </div>

              <div className="flex items-start sm:items-center gap-3">
                <input
                  type="checkbox"
                  id="isLost-top"
                  {...register('isLost')}
                  disabled={watchedIsSold}
                  className="w-5 h-5 mt-0.5 sm:mt-0 rounded border-border-subtle text-accent-primary focus:ring-accent-primary bg-bg-card shrink-0 disabled:opacity-30"
                />
                <label htmlFor="isLost-top" className={cn("text-sm font-bold text-text-main cursor-pointer select-none leading-tight", watchedIsSold && "opacity-30 cursor-not-allowed")}>
                  Mark as Lost
                  <span className="block sm:inline sm:ml-2 text-[10px] text-text-muted font-medium normal-case tracking-normal">
                    Check this if the figure is missing or damaged
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Character Name */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Character Name(s)</label>
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Maker</label>
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
                  placeholder="e.g. Banpresto"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Series/Line/Scale (optional)</label>
              <input
                {...register('figureLine')}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                placeholder="e.g. 20th anniversary series"
              />
            </div>
          </div>

          {/* Price and Gift Switch Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Price */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Price</label>
              <div className="relative group">
                <input
                  type="number" step="0.01"
                  {...register('totalPrice', { required: true })}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Purchased/Gifted Switch */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Purchased/Gifted</label>
              <div className="flex items-center h-11">
                <div className="flex items-center bg-bg-deep p-1 rounded-xl border border-border-subtle w-full relative">
                  {/* Slider Background */}
                  <motion.div 
                    initial={false}
                    animate={{ x: watchedIsGifted ? '100%' : '0%' }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                    className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-accent-primary rounded-lg z-0"
                  />
                  
                  <button
                    type="button"
                    onClick={() => setValue('isGifted', false, { shouldValidate: true })}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors z-10",
                      !watchedIsGifted ? "text-white" : "text-text-muted hover:text-text-main"
                    )}
                  >
                    Purchased
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('isGifted', true, { shouldValidate: true })}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors z-10",
                      watchedIsGifted ? "text-white" : "text-text-muted hover:text-text-main"
                    )}
                  >
                    Gift
                  </button>
                  <input type="checkbox" className="hidden" {...register('isGifted')} />
                </div>
              </div>
            </div>
          </div>

          {/* Condition Row */}
          {!watchedIsGifted && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Purchase Condition</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['MSIB', 'MIB', 'BIB', 'LOOSE', 'PRE-ORDERED'].map((opt) => (
                  <label key={opt} className="relative group cursor-pointer">
                    <input
                      type="radio"
                      value={opt}
                      {...register('condition', { required: !watchedIsGifted })}
                      className="sr-only peer"
                    />
                    <div className="flex items-center justify-center py-3 px-1 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest border border-border-subtle rounded-xl bg-bg-surface text-text-muted peer-checked:bg-accent-primary/10 peer-checked:border-accent-primary peer-checked:text-accent-primary hover:border-accent-primary transition-all duration-200 text-center min-h-[44px]">
                      {opt}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Images (up to 3)</label>
            <div className="grid grid-cols-3 gap-3">
              {imageItems.map((item, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border-subtle bg-bg-surface relative group">
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
                <div className="aspect-square rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted relative hover:border-accent-primary transition-colors bg-bg-surface">
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

          {/* Additional Details */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Additional Details (optional)</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm resize-none"
              placeholder="e.g. Put the extra details of your figure here like the height, special value, etc"
            />
          </div>

          {/* removed checkboxes from bottom of new figure mode */}
        </fieldset>
      </form>
    </Modal>
  );
}
