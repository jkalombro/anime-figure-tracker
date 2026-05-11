import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, Box } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/utils';

interface EquipmentCardProps {
  key?: React.Key;
  equip: any;
  onEdit: (equip: any) => void;
  onDelete: (equip: any) => void;
}

export function EquipmentCard({ equip, onEdit, onDelete }: EquipmentCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-sophisticated p-4 flex items-center gap-6"
    >
      <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-soft shrink-0">
        <Box className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-semibold text-text-main truncate">{equip.description}</h3>
        <p className="text-[10px] sm:text-xs mt-1 font-bold uppercase tracking-widest">
          <span className="text-text-muted/40 font-black">Price: </span>
          <span className="text-accent-soft font-black tabular-nums">{formatCurrency(equip.totalPrice)}</span>
        </p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(equip)}
          className="p-2 text-text-muted hover:text-accent-soft transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(equip)}
          className="p-2 text-text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
