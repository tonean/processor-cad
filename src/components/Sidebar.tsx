import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, ChevronDownIcon } from 'lucide-react';

interface SidebarProps {
  isDarkMode?: boolean;
  onResize?: (width: number) => void;
  onCollapse?: () => void;
  width?: number;
}

export const Sidebar = ({
  isDarkMode,
  onResize,
  onCollapse,
  width = 256
}: SidebarProps) => {
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
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(600, startWidth + deltaX)); // Allow expanding up to 600px
    
    if (newWidth <= 30) {
      // Collapse sidebar if dragged very close to left edge
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

  return (
    <aside 
      ref={sidebarRef}
      className="relative border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-200 flex flex-col"
      style={{ width: `${width}px` }}
    >
      <div className="p-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Simulations</h2>
          <div className="flex items-center space-x-1">
            <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200">
              <PlusIcon size={16} />
            </button>
            <button 
              onClick={onCollapse}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
            >
              <ChevronDownIcon size={16} />
            </button>
          </div>
        </div>
        <div className="mb-4">
          <button className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-gray-200 rounded-md transition-colors duration-200 text-sm">
            Test 1
          </button>
        </div>
        <div>
          <h2 className="text-sm font-medium mb-2">Chats</h2>
          {/* Chat items would go here */}
        </div>
      </div>
      
      {/* Drag handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
};