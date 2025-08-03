import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Undo2Icon, Redo2Icon, PlusIcon, MinusIcon, MaximizeIcon, SplitIcon, ChevronDownIcon, MessageSquareIcon } from 'lucide-react';
interface TopNavBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  zoom: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
}
export const TopNavBar = ({
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoom,
  isDarkMode,
  toggleTheme
}: TopNavBarProps) => {
  // Format zoom level to percentage
  const zoomPercentage = Math.round(zoom * 100);
  return <header className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <div className="flex items-center space-x-2">
        <Logo />
        <div className="h-6 w-6 flex items-center justify-center">
          <ChevronDownIcon size={16} />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <div className="p-1 border border-gray-200 dark:border-gray-700 rounded">
            <Undo2Icon size={14} />
          </div>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <div className="p-1 border border-gray-200 dark:border-gray-700 rounded">
            <Redo2Icon size={14} />
          </div>
        </button>
        <div className="h-4 border-r border-gray-200 dark:border-gray-700 mx-1"></div>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onClick={onZoomIn} title="Zoom In">
          <PlusIcon size={16} />
        </button>
        <div className="text-xs font-medium px-2">{zoomPercentage}%</div>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onClick={onZoomOut} title="Zoom Out">
          <MinusIcon size={16} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onClick={onZoomReset} title="Reset Zoom">
          <MaximizeIcon size={16} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <SplitIcon size={16} />
        </button>
        <div className="h-4 border-r border-gray-200 dark:border-gray-700 mx-1"></div>
        <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </div>
      <div className="flex items-center space-x-1">
        <button className="px-3 py-1 rounded-md flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <span className="font-medium">Meow</span>
          <ChevronDownIcon size={16} className="ml-1" />
        </button>
      </div>
      <div className="flex items-center space-x-3">
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md px-3 py-1 text-sm transition-colors duration-200">
          2 / 5
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <MessageSquareIcon size={20} />
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-400">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=64&q=80" alt="User profile" className="h-full w-full object-cover" />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-1 transition-colors duration-200">
          Share
        </button>
      </div>
    </header>;
};