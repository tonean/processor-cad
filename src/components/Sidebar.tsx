import React from 'react';
import { PlusIcon } from 'lucide-react';
interface SidebarProps {
  isDarkMode?: boolean;
}
export const Sidebar = ({
  isDarkMode
}: SidebarProps) => {
  return <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Folders</h2>
          <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200">
            <PlusIcon size={16} />
          </button>
        </div>
        <div className="mb-4">
          <button className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md transition-colors duration-200 text-sm">
            Page 1
          </button>
        </div>
        <div>
          <h2 className="text-sm font-medium mb-2">Chats</h2>
          {/* Chat items would go here */}
        </div>
      </div>
    </aside>;
};