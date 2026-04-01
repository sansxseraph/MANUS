import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  onConfirm,
  onClose,
  isDestructive = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-manus-dark/90 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-manus-dark border border-manus-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-manus-orange/20 text-manus-orange'}`}>
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            
            <h3 className="text-xl font-display font-black text-manus-white uppercase tracking-widest mb-4">
              {title}
            </h3>
            
            <p className="text-manus-white/60 text-sm font-medium mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-full text-xs font-black text-manus-white/40 hover:text-manus-white uppercase tracking-widest transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isDestructive ? 'bg-red-500 text-manus-white hover:bg-red-600' : 'bg-manus-orange text-manus-white hover:bg-manus-white hover:text-manus-dark'}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
