import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, Camera, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface ShowcaseCardProps {
  key?: React.Key;
  showcase: any;
  onEdit: (showcase: any) => void;
  onDelete: (showcase: any) => void;
  onChangeThumbnail: (showcase: any) => void;
  index: number;
}

export function ShowcaseCard({
  showcase,
  onEdit,
  onDelete,
  onChangeThumbnail,
  index,
}: ShowcaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-sophisticated group flex flex-col h-full bg-bg-surface border-border-subtle hover:border-accent-primary/30 transition-all overflow-hidden"
    >
      <div className="h-48 bg-bg-deep relative overflow-hidden">
        {(showcase.thumbnailUrl || (showcase.imageUrls && showcase.imageUrls.length > 0)) ? (
           <img 
             src={showcase.thumbnailUrl || showcase.imageUrls[0]} 
             alt="" 
             className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" 
             referrerPolicy="no-referrer"
           />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-4 left-4">
           <button
             onClick={() => onChangeThumbnail(showcase)}
             className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/10 group/thumb"
             title="Change Thumbnail"
           >
             <Camera className="w-4 h-4" />
           </button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
           <button
             onClick={() => onEdit(showcase)}
             className="w-10 h-10 bg-bg-surface/80 backdrop-blur-md rounded-xl flex items-center justify-center text-text-muted hover:text-accent-primary transition-all border border-border-subtle"
           >
             <Edit2 className="w-4 h-4" />
           </button>
           <button
             onClick={() => onDelete(showcase)}
             className="w-10 h-10 bg-bg-surface/80 backdrop-blur-md rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 transition-all border border-border-subtle"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-black text-text-main tracking-tight uppercase italic">{showcase.name}</h4>
          <p className="text-[9px] sm:text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
             <LinkIcon className="w-3 h-3" />
             Collection Exhibition
          </p>
        </div>
        <p className="text-[11px] sm:text-xs text-text-muted line-clamp-3 leading-relaxed flex-1">
          {showcase.description}
        </p>
        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
           <div className="flex -space-x-2">
              {showcase.imageUrls?.slice(1).map((url: string, i: number) => (
                 <div key={i} className="w-8 h-8 rounded-lg border-2 border-bg-surface overflow-hidden bg-bg-surface shadow-sm">
                    <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 </div>
              ))}
              {showcase.imageUrls?.length > 1 && (
                <div className="text-[10px] font-black text-text-muted ml-4 flex items-center">
                   +{showcase.imageUrls.length - 1} More
                </div>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
