import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    color?: 'danger' | 'default';
  }>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  items
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 min-w-36"
      style={{
        left: position.x,
        top: position.y,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`
            w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-2
            ${item.color === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
          `}
        >
          {item.icon && <span className="text-base">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </motion.div>
  );
};
