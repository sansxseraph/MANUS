import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ManiculeBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ManiculeBadge: React.FC<ManiculeBadgeProps> = ({ 
  className, 
  size = 'md',
  showLabel = false 
}) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const containerSizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={cn(
          "bg-manus-orange rounded-lg flex items-center justify-center shadow-lg shadow-manus-orange/20 rotate-12",
          containerSizes[size]
        )}
      >
        <div className={cn("flex items-center justify-center -rotate-12", sizes[size])}>
          <img 
            src="/logo.svg" 
            alt="Manicule" 
            className="w-full h-full object-contain brightness-0 invert"
          />
        </div>
      </motion.div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-manus-orange uppercase tracking-[0.2em] leading-none">MANICULE</span>
          <span className="text-[8px] font-black text-manus-white/40 uppercase tracking-[0.1em]">ETHICAL CREATOR</span>
        </div>
      )}
    </div>
  );
};
