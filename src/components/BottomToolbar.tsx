import React, { useRef } from 'react';
import { PlusIcon, DownloadIcon, MousePointerIcon, ChevronDownIcon } from 'lucide-react';

interface BottomToolbarProps {
  isDarkMode?: boolean;
  onOpenModal: () => void;
}

export const BottomToolbar = ({
  isDarkMode,
  onOpenModal
}: BottomToolbarProps) => {
  const addNewButtonRef = useRef<HTMLButtonElement>(null);

  const handleAddNewClick = () => {
    console.log('Add New button clicked!'); // Debug log
    onOpenModal();
  };

  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <button className="flex items-center justify-center px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
        <div className="flex items-center">
          <MousePointerIcon size={16} />
          <ChevronDownIcon size={14} className="ml-1" />
        </div>
      </button>
      <div className="h-6 border-r border-gray-200 dark:border-gray-700 mx-1"></div>
      <button 
        ref={addNewButtonRef}
        onClick={handleAddNewClick}
        className="flex items-center px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <PlusIcon size={16} className="mr-1.5" />
        <span>Add New</span>
      </button>
      <button className="flex items-center px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
        <DownloadIcon size={16} className="mr-1.5" />
        <span>Import</span>
      </button>
    </div>
  );
};