import React, { useState, useRef, useEffect } from 'react';
import { MessageSquareIcon, PlusIcon, ChevronDownIcon, ImageIcon, MousePointerIcon, SlashIcon, Grid3X3Icon, ClockIcon, ArrowUpIcon } from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onResize?: (width: number) => void;
  onCollapse?: () => void;
  width?: number;
}

export const RightSidebar = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  onResize, 
  onCollapse, 
  width = 256 
}: RightSidebarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(width);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = startX - e.clientX; // Inverted for right sidebar
    const newWidth = Math.max(200, Math.min(600, startWidth + deltaX)); // Allow expanding up to 600px
    
    console.log('Right sidebar drag:', { deltaX, newWidth, startWidth, startX, clientX: e.clientX });
    
    // For right sidebar, dragging right (positive deltaX) makes it smaller
    // We need to check if it's getting very narrow
    if (newWidth <= 30) {
      console.log('Collapsing right sidebar');
      // Collapse sidebar if dragged very close to right edge
      onCollapse?.();
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('dragging');
      return;
    }
    
    onResize?.(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('dragging');
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startX, startWidth]);

  if (!isOpen) return null;

  return (
    <aside 
      ref={sidebarRef}
      className="relative border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-200 flex flex-col z-50"
      style={{ width: `${width}px` }}
    >
      <div className="p-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Chat</h2>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
          >
            <ChevronDownIcon size={16} />
          </button>
        </div>
        
        {/* No new chats message in the middle */}
        <div className="flex-1 flex items-center justify-center mt-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No new chats</p>
          </div>
        </div>
      </div>
      
      {/* Input field at the bottom */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Type / to see commands"
            className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
            <ArrowUpIcon size={16} />
          </button>
        </div>
        
        {/* Icons row below input */}
        <div className="flex items-center space-x-4 mt-3">
          <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
            <ImageIcon size={16} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
            <MousePointerIcon size={16} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
            <SlashIcon size={16} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
            <Grid3X3Icon size={16} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
            <ClockIcon size={16} />
          </button>
        </div>
      </div>
      
      {/* Drag handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-4 cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}; 