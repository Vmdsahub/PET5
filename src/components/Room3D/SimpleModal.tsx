import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface SimpleModalProps {
  title: string | React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  width?: string;
  height?: string;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  title,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
  width = '400px',
  height = 'auto'
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target !== event.currentTarget && 
        !(event.target as HTMLElement).closest('.modal-header')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y
    });
    
    event.preventDefault();
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;

    const newX = event.clientX - dragStart.x;
    const newY = event.clientY - dragStart.y;

    // Limitar dentro da viewport
    const maxX = window.innerWidth - 300; // largura mínima visível
    const maxY = window.innerHeight - 100; // altura mínima visível

    setPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        ref={modalRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          width,
          height: height !== 'auto' ? height : 'auto',
          maxHeight: '80vh'
        }}
      >
        {/* Header */}
        <div 
          className="modal-header bg-gray-50 border-b border-gray-200 px-4 py-3 rounded-t-lg cursor-move select-none flex justify-between items-center"
          onMouseDown={handleMouseDown}
        >
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Dragging indicator */}
        {isDragging && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Movendo...
          </div>
        )}
      </div>
    </div>
  );
};
