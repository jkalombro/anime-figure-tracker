import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../utils/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Modal({ isOpen, onClose, title, children, footer, className, disabled }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={disabled ? undefined : onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-h-[calc(90vh)] md:max-w-2xl bg-bg-surface rounded-3xl z-50 overflow-hidden flex flex-col shadow-2xl border border-border-subtle",
              className
            )}
          >
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-card/50">
              <h2 className="text-xl font-medium text-text-main">{title}</h2>
              <button
                onClick={onClose}
                disabled={disabled}
                className="p-2 hover:bg-bg-card rounded-full transition-colors text-text-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {children}
            </div>
            {footer && (
              <div className="p-6 border-t border-border-subtle bg-bg-surface">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
