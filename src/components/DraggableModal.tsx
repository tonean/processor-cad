import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon } from 'lucide-react';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  initialPosition?: { x: number; y: number };
  modalPosition: { x: number; y: number };
  onDrag?: (newPosition: { x: number; y: number }) => void;
  canvasZoom?: number;
  canvasPan?: { x: number; y: number };
  onPortDrag?: (portId: string, startPosition: { x: number; y: number }) => void;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
  initialPosition = { x: 0, y: 0 },
  modalPosition,
  onDrag,
  canvasZoom = 1,
  canvasPan = { x: 0, y: 0 },
  onPortDrag
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('Modal mouse down - starting drag');
    e.stopPropagation(); // Prevent canvas dragging
    
    const currentScreenX = modalPosition.x * canvasZoom + canvasPan.x;
    const currentScreenY = modalPosition.y * canvasZoom + canvasPan.y;
    
    // Calculate offset from mouse to modal's top-left corner in canvas coordinates
    const offsetX = (e.clientX - currentScreenX) / canvasZoom;
    const offsetY = (e.clientY - currentScreenY) / canvasZoom;
    
    console.log('Drag offset calculated:', { offsetX, offsetY });
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    console.log('isDragging set to true');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && onDrag) {
      console.log('Mouse move while dragging');
      // Convert mouse position to canvas coordinates, accounting for the drag offset
      const canvasX = (e.clientX - canvasPan.x) / canvasZoom - dragOffset.x;
      const canvasY = (e.clientY - canvasPan.y) / canvasZoom - dragOffset.y;
      
      console.log('New canvas position:', { canvasX, canvasY });
      onDrag({ x: canvasX, y: canvasY });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    console.log('Mouse up detected - stopping drag');
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log('isDragging set to false');
  };

  // Mouse move and up listeners for the entire document when dragging
  useEffect(() => {
    console.log('useEffect triggered, isDragging:', isDragging);
    if (isDragging) {
      console.log('Setting up global mouse listeners');
      const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
      const handleGlobalMouseUp = (e: MouseEvent) => handleMouseUp(e);
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        console.log('Cleaning up global mouse listeners');
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]); // Only depend on isDragging, not the other values that change during drag

  const handlePortMouseDown = (e: React.MouseEvent, portId: string, position: 'top' | 'bottom') => {
    e.stopPropagation();
    if (onPortDrag) {
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        const portX = modalPosition.x + (position === 'top' ? 200 : 200); // Center of modal
        const portY = modalPosition.y + (position === 'top' ? 0 : 120); // Top or bottom of modal
        onPortDrag(portId, { x: portX, y: portY });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 ${
        isDragging 
          ? 'border-blue-500 dark:border-blue-400' 
          : 'border-gray-200 dark:border-gray-700'
      } min-w-[400px] min-h-[120px] transition-colors duration-200 relative`}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection Ports */}
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-crosshair hover:bg-blue-600 transition-colors duration-200"
        style={{ top: '-8px' }}
        onMouseDown={(e) => handlePortMouseDown(e, 'modal-top', 'top')}
      />

      {/* Header */}
      <div className="flex items-center justify-center p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 text-center">
          Add a New Chat
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <XIcon size={15} />
        </button>
      </div>
      
      {/* Empty content area */}
      <div className="p-3">
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          <p className="text-sm">Chat Node</p>
          <p className="text-xs mt-2">Connect to other nodes</p>
        </div>
      </div>
    </div>
  );
};