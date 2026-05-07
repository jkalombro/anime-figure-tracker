import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../utils/utils';

interface AddItemButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const AddItemButton: React.FC<AddItemButtonProps> = ({ 
  onClick, 
  label, 
  className,
  disabled,
  icon = <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-primary-sophisticated h-10 px-4 sm:px-6 flex items-center justify-center gap-2 transition-all group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:hover:brightness-100 disabled:active:scale-100",
        className
      )}
    >
      <span className="group-hover:scale-110 transition-transform hidden sm:flex items-center justify-center">
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden font-bold whitespace-nowrap">+ New</span>
    </button>
  );
};
