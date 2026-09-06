'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NeoSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface NeoSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: NeoSelectOption[];
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  disabled?: boolean;
  ariaLabel?: string;
}

export default function NeoSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  wrapperClassName = '',
  menuClassName = '',
  size = 'sm',
  align = 'right',
  disabled = false,
  ariaLabel = 'Select',
}: NeoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isFullWidth = className.includes('w-full');

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[11px] font-bold rounded-lg',
    md: 'px-3 py-1.5 text-xs font-black rounded-xl',
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullWidth ? 'w-full block' : 'inline-block'} ${
        isOpen ? 'z-30' : 'z-10'
      } ${wrapperClassName}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 text-gray-800 dark:text-white shadow-neo-sm hover:shadow-neo hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
          sizeStyles[size]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 stroke-[2.5] text-gray-700 dark:text-gray-300 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-black dark:text-[#FFE600]' : ''
          }`}
        />
      </button>

      {/* Custom Neo-Brutalist Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            role="listbox"
            className={`absolute top-full mt-1.5 ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${
              isFullWidth ? 'w-full min-w-full' : 'min-w-[140px] max-w-[220px]'
            } bg-white dark:bg-[#1A1C24] border-2 border-black dark:border-gray-700 rounded-2xl shadow-neo p-1 z-50 max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 ${menuClassName}`}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-left rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 select-none ${
                    isSelected
                      ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm'
                      : 'text-gray-800 dark:text-gray-200 hover:bg-[#FAF8F5] dark:hover:bg-[#282B38] border-2 border-transparent hover:border-black'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.badge && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 stroke-[3] text-black flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
