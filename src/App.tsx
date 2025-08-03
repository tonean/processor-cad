import React, { useEffect, useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { BottomToolbar } from './components/BottomToolbar';
export function App() {
  const [zoom, setZoom] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved theme preference or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || !savedTheme && prefersDark;
    }
    return false;
  });
  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 3));
  };
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.5));
  };
  const handleZoomReset = () => {
    setZoom(1);
  };
  return <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <TopNavBar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomReset={handleZoomReset} zoom={zoom} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 relative bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
          {/* Dotted grid background with zoom applied */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#4a5568_1px,transparent_1px)] origin-center transition-colors duration-200" style={{
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
          left: `${(1 - 1 / zoom) * 50}%`,
          top: `${(1 - 1 / zoom) * 50}%`
        }}></div>
        </main>
      </div>
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <BottomToolbar isDarkMode={isDarkMode} />
      </div>
      <div className="absolute bottom-6 right-6">
        <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
          ?
        </button>
      </div>
    </div>;
}