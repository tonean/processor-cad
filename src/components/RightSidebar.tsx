import React from 'react';
import { MessageSquareIcon, PlusIcon, ChevronDownIcon } from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const RightSidebar = ({ isOpen, onClose, isDarkMode }: RightSidebarProps) => {
  if (!isOpen) return null;

  return (
    <aside className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Chat</h2>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
          >
            <ChevronDownIcon size={16} />
          </button>
        </div>
        
        <div className="mb-4">
          <button className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-gray-200 rounded-md transition-colors duration-200 text-sm">
            Current Session
          </button>
        </div>
        
        <div>
          <h2 className="text-sm font-medium mb-2">History</h2>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 text-sm text-gray-600 dark:text-gray-400">
              Previous Chat 1
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 text-sm text-gray-600 dark:text-gray-400">
              Previous Chat 2
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 text-sm text-gray-600 dark:text-gray-400">
              Previous Chat 3
            </button>
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-sm font-medium mb-2">Actions</h2>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 text-sm text-gray-600 dark:text-gray-400">
              Clear History
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 text-sm text-gray-600 dark:text-gray-400">
              Export Chat
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}; 