import React from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}
export const ThemeToggle = ({
  isDarkMode,
  toggleTheme
}: ThemeToggleProps) => {
  return <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={toggleTheme} title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      {isDarkMode ? <SunIcon size={18} className="text-gray-100" /> : <MoonIcon size={18} className="text-gray-600" />}
    </button>;
};