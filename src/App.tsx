import React, { useEffect, useState, useRef } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { BottomToolbar } from './components/BottomToolbar';
import { RightSidebar } from './components/RightSidebar';

export function App() {
  const [zoom, setZoom] = useState(1);
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

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
    setPan({ x: 0, y: 0 });
  };

  const handlePanReset = () => {
    setPan({ x: 0, y: 0 });
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!isMouseOverCanvas) return;
    
    // Check if this is a pinch gesture (touchpad pinch)
    if (event.deltaMode === 1) {
      event.preventDefault();
      
      const delta = event.deltaY;
      const zoomFactor = 0.1;
      
      if (delta > 0) {
        // Zoom out
        setZoom(prevZoom => Math.max(prevZoom - zoomFactor, 0.5));
      } else {
        // Zoom in
        setZoom(prevZoom => Math.min(prevZoom + zoomFactor, 3));
      }
    }
    // For regular mouse wheel, we can still allow it but with smaller increments
    else if (Math.abs(event.deltaY) > 0) {
      event.preventDefault();
      
      const delta = event.deltaY;
      const zoomFactor = 0.05; // Smaller increment for mouse wheel
      
      if (delta > 0) {
        // Zoom out
        setZoom(prevZoom => Math.max(prevZoom - zoomFactor, 0.5));
      } else {
        // Zoom in
        setZoom(prevZoom => Math.min(prevZoom + zoomFactor, 3));
      }
    }
  };

  const handleMouseEnter = () => {
    setIsMouseOverCanvas(true);
    document.body.classList.add('canvas-focused');
  };

  const handleMouseLeave = () => {
    setIsMouseOverCanvas(false);
    document.body.classList.remove('canvas-focused');
    // Stop dragging if mouse leaves canvas
    setIsDragging(false);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button only
      setIsDragging(true);
      setDragStart({
        x: event.clientX - pan.x,
        y: event.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <TopNavBar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomReset={handleZoomReset} zoom={zoom} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onChatToggle={handleChatToggle} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isDarkMode={isDarkMode} />
        <main 
          ref={canvasRef}
          className="flex-1 relative bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200 canvas-zoom-area"
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            transformStyle: 'preserve-3d'
          }}
          onWheel={handleWheel}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Infinite dotted grid background with zoom applied */}
          <div 
            className="absolute bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#4a5568_1px,transparent_1px)] origin-center transition-colors duration-200" 
            style={{
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center',
              width: `${2000 / zoom}%`,
              height: `${2000 / zoom}%`,
              left: `${-1000 / zoom}%`,
              top: `${-1000 / zoom}%`,
              backfaceVisibility: 'hidden',
              willChange: 'transform',
              transformStyle: 'preserve-3d'
            }}
          />
        </main>
        {isChatOpen && <RightSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} isDarkMode={isDarkMode} />}
      </div>
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <BottomToolbar isDarkMode={isDarkMode} />
      </div>
      <div className="absolute bottom-6 right-6">
        <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
          ?
        </button>
      </div>
    </div>
  );
}