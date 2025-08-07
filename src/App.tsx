import React, { useEffect, useState, useRef } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { BottomToolbar } from './components/BottomToolbar';
import { RightSidebar } from './components/RightSidebar';
import { DraggableModal } from './components/DraggableModal';

export function App() {
  const [zoom, setZoom] = useState(0.8);
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
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
    isSelected: boolean;
    isResizing: boolean;
    resizeStart: { x: number; y: number; width: number; height: number };
  }>>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalInputValue, setModalInputValue] = useState('');
  const [modalIsLoading, setModalIsLoading] = useState(false);
  
  // Edge/Connection state
  const [edges, setEdges] = useState<Array<{
    id: string;
    sourcePort: string;
    targetPort: string;
    sourceNode: string;
    targetNode: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    targetImageId?: string; // Added for image connections
  }>>([]);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<{ portId: string; position: { x: number; y: number } } | null>(null);
  const [currentEdgeEnd, setCurrentEdgeEnd] = useState({ x: 0, y: 0 });
  
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

  // Function to calculate intersection point between a line and a rectangle
  const calculateLineRectIntersection = (x1: number, y1: number, x2: number, y2: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number) => {
    const rectRight = rectX + rectWidth;
    const rectBottom = rectY + rectHeight;
    
    // Check intersection with each edge of the rectangle
    const intersections = [];
    
    // Top edge
    if (y1 !== y2) {
      const t = (rectY - y1) / (y2 - y1);
      if (t >= 0 && t <= 1) {
        const x = x1 + t * (x2 - x1);
        if (x >= rectX && x <= rectRight) {
          intersections.push({ x, y: rectY });
        }
      }
    }
    
    // Bottom edge
    if (y1 !== y2) {
      const t = (rectBottom - y1) / (y2 - y1);
      if (t >= 0 && t <= 1) {
        const x = x1 + t * (x2 - x1);
        if (x >= rectX && x <= rectRight) {
          intersections.push({ x, y: rectBottom });
        }
      }
    }
    
    // Left edge
    if (x1 !== x2) {
      const t = (rectX - x1) / (x2 - x1);
      if (t >= 0 && t <= 1) {
        const y = y1 + t * (y2 - y1);
        if (y >= rectY && y <= rectBottom) {
          intersections.push({ x: rectX, y });
        }
      }
    }
    
    // Right edge
    if (x1 !== x2) {
      const t = (rectRight - x1) / (x2 - x1);
      if (t >= 0 && t <= 1) {
        const y = y1 + t * (y2 - y1);
        if (y >= rectY && y <= rectBottom) {
          intersections.push({ x: rectRight, y });
        }
      }
    }
    
    // Find the closest intersection point to the start point
    if (intersections.length > 0) {
      let closest = intersections[0];
      let minDistance = Math.sqrt((closest.x - x1) ** 2 + (closest.y - y1) ** 2);
      
      for (const intersection of intersections) {
        const distance = Math.sqrt((intersection.x - x1) ** 2 + (intersection.y - y1) ** 2);
        if (distance < minDistance) {
          minDistance = distance;
          closest = intersection;
        }
      }
      
      return closest;
    }
    
    // Fallback to center if no intersection found
    return { x: rectX + rectWidth / 2, y: rectY + rectHeight / 2 };
  };

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
      // Position modal more to the right and down on the canvas
      const initialX = -pan.x / zoom + 270; // More to the right (was 100)
      const initialY = -pan.y / zoom + 400; // Much more down (was 170)
      setModalPosition({ x: initialX, y: initialY });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalInputValue('');
    // Remove all connections when modal is closed
    setEdges([]);
  };

  const handleModalDrag = (newPosition: { x: number; y: number }) => {
    setModalPosition(newPosition);
  };

  const handleModalInputChange = (value: string) => {
    setModalInputValue(value);
  };

  const handleModalSendMessage = async () => {
    if (!modalInputValue.trim() || modalIsLoading) return;

    // Find the connected image for this modal
    const connectedEdge = edges.find(edge => edge.sourceNode === 'modal');
    if (!connectedEdge || !connectedEdge.targetImageId) {
      // Add helpful message to the right sidebar chat
      const helpMessage = {
        id: Date.now(),
        sender: 'bot' as const,
        content: 'Please connect this chat to a CAD element first by dragging from the blue port at the top of the modal to an image on the canvas.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if ((window as any).addMessageToChat) {
        (window as any).addMessageToChat(helpMessage);
      }
      return;
    }

    const connectedImage = images.find(img => img.id === connectedEdge.targetImageId);
    if (!connectedImage) {
      console.log('Connected image not found');
      return;
    }

    setModalIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found in environment variables');
      }

      // Prepare the message with image context
      const messageWithContext = `You are a helpful CAD (Computer-Aided Design) assistant. The user has connected a chat to a specific CAD model element (image). Please analyze the image and respond to their question about this CAD element.

User's question about the CAD element: ${modalInputValue.trim()}

Please provide a detailed response about the CAD element shown in the image, addressing the user's specific question.`;

      // Extract image data and mime type
      const imageDataMatch = connectedImage.src.match(/^data:([^;]+);base64,(.+)$/);
      if (!imageDataMatch) {
        throw new Error('Invalid image data format');
      }
      
      const mimeType = imageDataMatch[1];
      const base64Data = imageDataMatch[2];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: messageWithContext
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Add the conversation to the right sidebar chat
        const userMessage = {
          id: Date.now(),
          sender: 'user' as const,
          content: modalInputValue.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot' as const,
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add messages to the right sidebar chat
        if ((window as any).addMessageToChat) {
          (window as any).addMessageToChat(userMessage);
          (window as any).addMessageToChat(botMessage);
        }
        
        // Clear the modal input
        setModalInputValue('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending modal message:', error);
      
      // Add error message to the right sidebar chat
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot' as const,
        content: `Sorry, I'm having trouble analyzing the CAD element. Please make sure the image is connected and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if ((window as any).addMessageToChat) {
        (window as any).addMessageToChat(errorMessage);
      }
    } finally {
      setModalIsLoading(false);
    }
  };

  const handlePortDrag = (portId: string, startPosition: { x: number; y: number }) => {
    console.log('Port drag started:', portId, startPosition);
    setIsCreatingEdge(true);
    setEdgeStart({ portId, position: startPosition });
    setCurrentEdgeEnd(startPosition);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isCreatingEdge) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert screen coordinates to canvas coordinates
        const canvasX = (mouseX - pan.x) / zoom;
        const canvasY = (mouseY - pan.y) / zoom;
        
        setCurrentEdgeEnd({ x: canvasX, y: canvasY });
        
        // Check if mouse is over any image
        const targetImage = images.find(image => {
          const imageScreenX = image.x * zoom + pan.x;
          const imageScreenY = image.y * zoom + pan.y;
          const imageScreenWidth = image.width * zoom;
          const imageScreenHeight = image.height * zoom;
          
          return mouseX >= imageScreenX && 
                 mouseX <= imageScreenX + imageScreenWidth &&
                 mouseY >= imageScreenY && 
                 mouseY <= imageScreenY + imageScreenHeight;
        });
        
        // Update current target image for visual feedback
        if (targetImage) {
          // Highlight the target image
          setImages(prev => prev.map(img => ({
            ...img,
            isSelected: img.id === targetImage.id
          })));
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isCreatingEdge && edgeStart) {
      console.log('Edge creation finished');
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Find if we're dropping on an image
        const targetImage = images.find(image => {
          const imageScreenX = image.x * zoom + pan.x;
          const imageScreenY = image.y * zoom + pan.y;
          const imageScreenWidth = image.width * zoom;
          const imageScreenHeight = image.height * zoom;
          
          const mouseX = currentEdgeEnd.x * zoom + pan.x;
          const mouseY = currentEdgeEnd.y * zoom + pan.y;
          
          return mouseX >= imageScreenX && 
                 mouseX <= imageScreenX + imageScreenWidth &&
                 mouseY >= imageScreenY && 
                 mouseY <= imageScreenY + imageScreenHeight;
        });
        
        if (targetImage) {
          // Store the mouse release position to preserve the exact curve shape
          const mouseCanvasX = currentEdgeEnd.x;
          const mouseCanvasY = currentEdgeEnd.y;
          
          // Create permanent connection to the image
          const newEdge = {
            id: `edge-${Date.now()}`,
            sourcePort: edgeStart.portId,
            targetPort: `image-${targetImage.id}`,
            sourceNode: 'modal',
            targetNode: targetImage.id,
            startX: edgeStart.position.x,
            startY: edgeStart.position.y,
            endX: mouseCanvasX, // Store the exact mouse position for curve calculation
            endY: mouseCanvasY,
            targetImageId: targetImage.id
          };
          
          setEdges(prev => [...prev, newEdge]);
          console.log('Created connection to image:', targetImage.id);
        }
      }
      
      // Clear the dragging state
      setIsCreatingEdge(false);
      setEdgeStart(null);
      setCurrentEdgeEnd({ x: 0, y: 0 });
      
      // Clear image selection
      setImages(prev => prev.map(img => ({ ...img, isSelected: false })));
    }
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
              dragStart: { x: 0, y: 0 },
              isSelected: false,
              isResizing: false,
              resizeStart: { x: 0, y: 0, width: 0, height: 0 }
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
    // Prevent browser zoom when over canvas
    document.body.style.zoom = '1';
    document.body.style.transform = 'scale(1)';
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
            
            // Check if clicking on resize handle
            const isResizeHandle = target.closest('[data-resize-handle]');
            if (isResizeHandle) {
              setImages(prev => prev.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isResizing: true, 
                      resizeStart: { 
                        x: mouseX, 
                        y: mouseY, 
                        width: img.width, 
                        height: img.height 
                      }
                    }
                  : { ...img, isSelected: false }
              ));
              return;
            }
            
            // Regular image selection and dragging
            setImages(prev => prev.map(img => 
              img.id === imageId 
                ? { ...img, isDragging: true, isSelected: true, dragStart: { x: mouseX - img.x * zoom, y: mouseY - img.y * zoom } }
                : { ...img, isSelected: false }
            ));
            return; // Don't start canvas dragging
          }
        }
      }
      
      // Deselect all images if clicking on canvas
      setImages(prev => prev.map(img => ({ ...img, isSelected: false })));
      
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

    // Handle image resizing
    const resizingImage = images.find(img => img.isResizing);
    if (resizingImage) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const deltaX = mouseX - resizingImage.resizeStart.x;
        const deltaY = mouseY - resizingImage.resizeStart.y;
        
        // Much more gradual scaling for smoother resizing
        const scaleFactor = Math.max(0.1, 1 + (deltaX + deltaY) / 500);
        
        setImages(prev => prev.map(img => 
          img.isResizing 
            ? { 
                ...img, 
                width: resizingImage.resizeStart.width * scaleFactor,
                height: resizingImage.resizeStart.height * scaleFactor
              }
            : img
        ));
      }
    }

    // Handle edge creation
    handleCanvasMouseMove(event);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Stop image dragging
    setImages(prev => prev.map(img => ({ ...img, isDragging: false, isResizing: false })));

    // Handle edge creation
    handleCanvasMouseUp();
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
                zIndex: image.isDragging ? 1000 : 100
              }}
            >
              <img
                src={image.src}
                alt="Dropped image"
                className={`w-full h-full object-contain pointer-events-none ${
                  edges.some(edge => edge.targetImageId === image.id) 
                    ? 'outline outline-2 outline-blue-500 outline-offset-2' 
                    : image.isSelected 
                      ? 'outline outline-2 outline-blue-500 outline-offset-2' 
                      : ''
                }`}
                draggable={false}
              />
              
              {/* Resize handle */}
              {image.isSelected && (
                <div
                  data-resize-handle
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white"
                  style={{
                    transform: 'translate(50%, 50%)'
                  }}
                />
              )}
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
                onPortDrag={handlePortDrag}
                inputValue={modalInputValue}
                onInputChange={handleModalInputChange}
                onSendMessage={handleModalSendMessage}
                isLoading={modalIsLoading}
                isConnected={edges.some(edge => edge.sourceNode === 'modal')}
              />
            </div>
          )}

          {/* Edges/Connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 2500
            }}
          >
            {/* Render existing edges */}
            {edges.map(edge => {
              // Get the target image for silhouette color
              const targetImage = images.find(img => img.id === edge.targetImageId);
              
              // Calculate start position - update based on current modal position
              let startX, startY;
              if (edge.sourceNode === 'modal') {
                // Use current modal position for dynamic updates
                // The dot center is 6px above the modal top (top: -6px) plus half the dot height (1.5px for a 3px dot)
                startX = (modalPosition.x + 200) * zoom + pan.x; // Center of modal (400px width / 2)
                startY = (modalPosition.y - 4.5) * zoom + pan.y; // Center of the dot (6px above - 1.5px to center)
              } else {
                startX = edge.startX * zoom + pan.x;
                startY = edge.startY * zoom + pan.y;
              }
              
              // Calculate end position - if it's an image connection, calculate intersection with image boundary
              let endX, endY;
              let curveTargetX, curveTargetY; // For preserving the curve shape
              
              if (targetImage) {
                // Get the stored mouse position for curve shape
                curveTargetX = edge.endX * zoom + pan.x;
                curveTargetY = edge.endY * zoom + pan.y;
                
                // Calculate image bounds in canvas coordinates first
                const imageX = targetImage.x;
                const imageY = targetImage.y;
                const imageWidth = targetImage.width;
                const imageHeight = targetImage.height;
                
                // Transform to screen coordinates
                const imageScreenX = imageX * zoom + pan.x;
                const imageScreenY = imageY * zoom + pan.y;
                const imageScreenWidth = imageWidth * zoom;
                const imageScreenHeight = imageHeight * zoom;
                
                // Account for the blue outline offset (outline-offset-2 = 8px)
                // The outline-offset-2 in Tailwind is 8px, and the outline itself is 2px
                // So we need to account for 10px total
                const outlineOffset = 10;
                const adjustedImageScreenX = imageScreenX - outlineOffset;
                const adjustedImageScreenY = imageScreenY - outlineOffset;
                const adjustedImageScreenWidth = imageScreenWidth + (outlineOffset * 2);
                const adjustedImageScreenHeight = imageScreenHeight + (outlineOffset * 2);
                
                // Calculate intersection point from modal to the curve target point
                const intersection = calculateLineRectIntersection(
                  startX, startY,
                  curveTargetX, curveTargetY, // Use stored mouse position for proper curve
                  adjustedImageScreenX, adjustedImageScreenY, 
                  adjustedImageScreenWidth, adjustedImageScreenHeight
                );
                
                // Debug logging
                console.log('Connection debug:', {
                  modalPos: { x: modalPosition.x, y: modalPosition.y },
                  imagePos: { x: imageX, y: imageY, width: imageWidth, height: imageHeight },
                  imageScreen: { 
                    x: imageScreenX, 
                    y: imageScreenY, 
                    width: imageScreenWidth,
                    height: imageScreenHeight
                  },
                  adjustedBounds: { 
                    x: adjustedImageScreenX, 
                    y: adjustedImageScreenY, 
                    width: adjustedImageScreenWidth,
                    height: adjustedImageScreenHeight
                  },
                  start: { x: startX, y: startY },
                  curveTarget: { x: curveTargetX, y: curveTargetY },
                  intersection: intersection,
                  zoom: zoom,
                  pan: pan
                });
                
                endX = intersection.x;
                endY = intersection.y;
              } else {
                endX = edge.endX * zoom + pan.x;
                endY = edge.endY * zoom + pan.y;
                curveTargetX = endX;
                curveTargetY = endY;
              }
              
              // Calculate curve using the original mouse position to preserve the shape
              const deltaXCurve = curveTargetX - startX;
              const deltaYCurve = curveTargetY - startY;
              const distanceCurve = Math.sqrt(deltaXCurve * deltaXCurve + deltaYCurve * deltaYCurve);
              
              // Use the actual end point for the final segment
              const deltaXEnd = endX - startX;
              const deltaYEnd = endY - startY;
              
              // Determine curve direction based on the original drag direction
              let offset = Math.min(distanceCurve * 0.1, 20);
              let pathData;
              
              if (Math.abs(deltaXCurve) > Math.abs(deltaYCurve)) {
                // Horizontal connection - curve vertically
                const controlX1 = startX + deltaXCurve * 0.5;
                const controlY1 = startY + (deltaYCurve > 0 ? offset : -offset);
                const controlX2 = startX + deltaXCurve * 0.5;
                const controlY2 = curveTargetY + (deltaYCurve > 0 ? -offset : offset);
                
                // Adjust the final control point to smoothly connect to the intersection
                const finalControlX = endX - (endX - controlX2) * 0.3;
                const finalControlY = endY - (endY - controlY2) * 0.3;
                
                pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${finalControlX} ${finalControlY}, ${endX} ${endY}`;
              } else {
                // Vertical connection - curve horizontally
                const controlX1 = startX + (deltaXCurve > 0 ? offset : -offset);
                const controlY1 = startY + deltaYCurve * 0.5;
                const controlX2 = curveTargetX + (deltaXCurve > 0 ? -offset : offset);
                const controlY2 = startY + deltaYCurve * 0.5;
                
                // Adjust the final control point to smoothly connect to the intersection
                const finalControlX = endX - (endX - controlX2) * 0.3;
                const finalControlY = endY - (endY - controlY2) * 0.3;
                
                pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${finalControlX} ${finalControlY}, ${endX} ${endY}`;
              }
              
              // Use silhouette color if it's an image connection, otherwise use default
              const strokeColor = targetImage ? '#3b82f6' : '#6b7280'; // Blue for image connections
              
              return (
                <g key={edge.id}>
                  <path
                    d={pathData}
                    stroke={strokeColor}
                    strokeWidth="2"
                    fill="none"
                    markerEnd={targetImage ? "url(#arrowhead)" : "url(#arrowhead-red)"}
                  />
                  {/* Add a subtle shadow/glow effect */}
                  <path
                    d={pathData}
                    stroke={strokeColor}
                    strokeWidth="1"
                    fill="none"
                    opacity="0.6"
                  />
                </g>
              );
            })}
            
            {/* Render edge being created */}
            {isCreatingEdge && edgeStart && (
              (() => {
                const startX = edgeStart.position.x * zoom + pan.x;
                const startY = edgeStart.position.y * zoom + pan.y;
                const endX = currentEdgeEnd.x * zoom + pan.x;
                const endY = currentEdgeEnd.y * zoom + pan.y;
                
                // Calculate direction for curve
                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Determine curve direction based on drag direction
                let offset = Math.min(distance * 0.1, 20); // Reduced from 0.3 to 0.1 and max from 50 to 20
                let pathData;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                  // Horizontal drag - curve vertically
                  const controlX1 = startX + deltaX * 0.5;
                  const controlY1 = startY + (deltaY > 0 ? offset : -offset);
                  const controlX2 = startX + deltaX * 0.5;
                  const controlY2 = endY + (deltaY > 0 ? -offset : offset);
                  pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                  
                  return (
                    <g>
                      <path
                        d={pathData}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="none"
                        markerEnd="url(#arrowhead-red)"
                      />
                      {/* Add a subtle shadow/glow effect for the creating edge */}
                      <path
                        d={pathData}
                        stroke="#fca5a5"
                        strokeWidth="1"
                        fill="none"
                        opacity="0.8"
                      />
                    </g>
                  );
                } else {
                  // Vertical drag - curve horizontally
                  const controlX1 = startX + (deltaX > 0 ? offset : -offset);
                  const controlY1 = startY + deltaY * 0.5;
                  const controlX2 = endX + (deltaX > 0 ? -offset : offset);
                  const controlY2 = startY + deltaY * 0.5;
                  pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                  
                  return (
                    <g>
                      <path
                        d={pathData}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="none"
                        markerEnd="url(#arrowhead-red)"
                      />
                      {/* Add a subtle shadow/glow effect for the creating edge */}
                      <path
                        d={pathData}
                        stroke="#fca5a5"
                        strokeWidth="1"
                        fill="none"
                        opacity="0.8"
                      />
                    </g>
                  );
                }
              })()
            )}
            
            {/* Arrow marker definitions */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="6"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#3b82f6"
                />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="8"
                markerHeight="6"
                refX="6"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#ef4444"
                />
              </marker>
            </defs>
          </svg>
        </main>
        {isChatOpen && (
          <RightSidebar 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            isDarkMode={isDarkMode}
            onResize={handleRightSidebarResize}
            onCollapse={handleRightSidebarCollapse}
            width={rightSidebarWidth}
            onAddMessage={(message) => {
              // This will be implemented in RightSidebar
              console.log('Adding message to sidebar:', message);
            }}
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