import React, { useEffect, useState, useRef } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { BottomToolbar } from './components/BottomToolbar';
import { RightSidebar } from './components/RightSidebar';
import { DraggableModal } from './components/DraggableModal';

export function App() {
  const [zoom, setZoom] = useState(1);
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(256);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [images, setImages] = useState<Array<{
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isDragging: boolean;
    dragStart: { x: number; y: number };
  }>>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  
  // Undo/Redo state
  const [history, setHistory] = useState<Array<{
    images: typeof images;
  }>>([{ images: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
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
    const newZoom = Math.min(zoom + 0.25, 3);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    setZoom(newZoom);
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

  const handleLeftSidebarResize = (width: number) => {
    setLeftSidebarWidth(width);
  };

  const handleRightSidebarResize = (width: number) => {
    setRightSidebarWidth(width);
  };

  const handleLeftSidebarCollapse = () => {
    setIsLeftSidebarCollapsed(true);
  };

  const handleRightSidebarCollapse = () => {
    setIsChatOpen(false);
  };

  const handleOpenModal = () => {
    // Only set initial position if modal is not already open
    if (!isModalOpen) {
      // Position modal in a good initial location on the canvas
      const initialX = -pan.x / zoom + 100;
      const initialY = -pan.y / zoom + 100;
      setModalPosition({ x: initialX, y: initialY });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalDrag = (newPosition: { x: number; y: number }) => {
    setModalPosition(newPosition);
  };

  const saveToHistory = (newImages: typeof images) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ images: newImages });
      // Limit history to 50 states to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setImages(state.images);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setImages(state.images);
      setHistoryIndex(newIndex);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const dropX = event.clientX - rect.left;
            const dropY = event.clientY - rect.top;
            
            // Convert screen coordinates to canvas coordinates
            const canvasX = (dropX - pan.x) / zoom;
            const canvasY = (dropY - pan.y) / zoom;
            
            const newImage = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              src: e.target?.result as string,
              x: canvasX,
              y: canvasY,
              width: img.width,
              height: img.height,
              isDragging: false,
              dragStart: { x: 0, y: 0 }
            };
            
            setImages(prev => {
              const newImages = [...prev, newImage];
              saveToHistory(newImages);
              return newImages;
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    // Only allow zooming when mouse is over canvas
    if (!isMouseOverCanvas) return;
    
    // Check if this is a pinch-to-zoom gesture (ctrlKey is pressed during touchpad pinch)
    if (event.ctrlKey) {
      event.preventDefault();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Get mouse position relative to canvas
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Calculate zoom factor based on wheel delta
      const delta = -event.deltaY;
      const zoomFactor = delta > 0 ? 1.02 : 0.98; // Much smaller zoom factor for smoother zooming
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);
      
      // Calculate new pan to zoom towards mouse cursor
      const zoomRatio = newZoom / zoom;
      const newPan = {
        x: mouseX - (mouseX - pan.x) * zoomRatio,
        y: mouseY - (mouseY - pan.y) * zoomRatio
      };
      
      setZoom(newZoom);
      setPan(newPan);
    }
    // Handle regular scrolling (for panning)
    else if (!event.ctrlKey && (event.deltaX !== 0 || event.deltaY !== 0)) {
      // Allow normal scrolling behavior when not pinch-zooming
      // You can implement panning here if desired
      event.preventDefault();
      
      const panSpeed = 1;
      setPan(prev => ({
        x: prev.x - event.deltaX * panSpeed,
        y: prev.y - event.deltaY * panSpeed
      }));
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
      // Check if mouse is over a sidebar
      const target = event.target as HTMLElement;
      if (target.closest('aside')) {
        return; // Don't start canvas dragging if over sidebar
      }
      
      // Check if clicking on an image
      const imageElement = target.closest('[data-image-id]');
      if (imageElement) {
        const imageId = imageElement.getAttribute('data-image-id');
        const image = images.find(img => img.id === imageId);
        if (image) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            setImages(prev => prev.map(img => 
              img.id === imageId 
                ? { ...img, isDragging: true, dragStart: { x: mouseX - img.x * zoom, y: mouseY - img.y * zoom } }
                : img
            ));
            return; // Don't start canvas dragging
          }
        }
      }
      
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
    
    // Handle image dragging
    const draggingImage = images.find(img => img.isDragging);
    if (draggingImage) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        setImages(prev => prev.map(img => 
          img.isDragging 
            ? { 
                ...img, 
                x: (mouseX - img.dragStart.x) / zoom,
                y: (mouseY - img.dragStart.y) / zoom
              }
            : img
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Stop image dragging
    setImages(prev => prev.map(img => ({ ...img, isDragging: false })));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <TopNavBar 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onZoomReset={handleZoomReset} 
        zoom={zoom} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        onChatToggle={handleChatToggle}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className="flex flex-1 overflow-hidden">
        {!isLeftSidebarCollapsed && (
          <Sidebar 
            isDarkMode={isDarkMode} 
            onResize={handleLeftSidebarResize}
            onCollapse={handleLeftSidebarCollapse}
            width={leftSidebarWidth}
          />
        )}
        {isLeftSidebarCollapsed && (
          <button
            onClick={() => setIsLeftSidebarCollapsed(false)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-40 w-6 h-12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 rounded-r-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="w-0 h-0 border-l-4 border-l-gray-400 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
          </button>
        )}
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
          onDragOver={handleDragOver}
          onDrop={handleDrop}
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
          
          {/* Images on canvas */}
          {images.map(image => (
            <div
              key={image.id}
              data-image-id={image.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${image.x * zoom + pan.x}px`,
                top: `${image.y * zoom + pan.y}px`,
                width: `${image.width * zoom}px`,
                height: `${image.height * zoom}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                zIndex: image.isDragging ? 1000 : 100
              }}
            >
              <img
                src={image.src}
                alt="Dropped image"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            </div>
          ))}
          
          {/* Modal on canvas */}
          {isModalOpen && (
            <div
              className="absolute"
              style={{
                left: `${modalPosition.x * zoom + pan.x}px`,
                top: `${modalPosition.y * zoom + pan.y}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                zIndex: 2000
              }}
            >
              <DraggableModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                isDarkMode={isDarkMode}
                modalPosition={modalPosition}
                onDrag={handleModalDrag}
                canvasZoom={zoom}
                canvasPan={pan}
              />
            </div>
          )}
        </main>
        {isChatOpen && (
          <RightSidebar 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            isDarkMode={isDarkMode}
            onResize={handleRightSidebarResize}
            onCollapse={handleRightSidebarCollapse}
            width={rightSidebarWidth}
          />
        )}
      </div>
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <BottomToolbar isDarkMode={isDarkMode} onOpenModal={handleOpenModal} />
      </div>
      <div className="absolute bottom-6 right-6 z-10">
        <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
          ?
        </button>
      </div>
    </div>
  );
}