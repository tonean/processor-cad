import React, { useRef, useState } from 'react';
import { PlusIcon, DownloadIcon, MousePointerIcon, ChevronDownIcon, GlobeIcon } from 'lucide-react';

interface BottomToolbarProps {
  isDarkMode?: boolean;
  onOpenModal: () => void;
}

export const BottomToolbar = ({
  isDarkMode,
  onOpenModal
}: BottomToolbarProps) => {
  const addNewButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedMode, setSelectedMode] = useState<'wireframe' | 'solid' | 'material'>('wireframe');

  const handleAddNewClick = () => {
    console.log('Add New button clicked!'); // Debug log
    onOpenModal();
  };

  const handleModeChange = (mode: 'wireframe' | 'solid' | 'material') => {
    setSelectedMode(mode);
    console.log('Mode changed to:', mode);
  };

  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 pr-4 text-gray-800 dark:text-gray-200 transition-colors duration-200">
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
      <div className="h-6 border-r border-gray-200 dark:border-gray-700 mx-1"></div>
      
      {/* 3D View Modes */}
      <div className="flex items-center space-x-2 ml-4">
        {/* Wireframe Mode */}
        <button
          onClick={() => handleModeChange('wireframe')}
          className={`w-6 h-6 rounded-full transition-all duration-200 ${
            selectedMode === 'wireframe' 
              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' 
              : ''
          }`}
          style={{
            background: 'linear-gradient(135deg, #93c5fd, #f9a8d4, #c4b5fd)',
            boxShadow: selectedMode === 'wireframe' ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'
          }}
          title="Wireframe - shows only edges"
        />
        
        {/* Solid/Shaded Mode */}
        <button
          onClick={() => handleModeChange('solid')}
          className={`w-6 h-6 rounded-full transition-all duration-200 ${
            selectedMode === 'solid' 
              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' 
              : ''
          }`}
          style={{
            backgroundColor: '#9ca3af',
            boxShadow: selectedMode === 'solid' ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'
          }}
          title="Solid/Shaded - filled surfaces with simple lighting (no textures)"
        />
        
        {/* Material Preview/Textured/Realistic Mode */}
        <button
          onClick={() => handleModeChange('material')}
          className={`w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center ${
            selectedMode === 'material' 
              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' 
              : ''
          }`}
          style={{
            backgroundColor: 'transparent',
            boxShadow: selectedMode === 'material' ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'
          }}
          title="Material Preview/Textured/Realistic - shows material colors, textures and environment lighting (preview of the final render)"
        >
          <GlobeIcon size={24} className="text-gray-600 dark:text-gray-300" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};