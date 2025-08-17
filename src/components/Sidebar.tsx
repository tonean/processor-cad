import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, ChevronDownIcon, Trash2Icon, PlayIcon, PauseIcon, SquareIcon } from 'lucide-react';

interface SidebarProps {
  isDarkMode?: boolean;
  onResize?: (width: number) => void;
  onCollapse?: () => void;
  width?: number;
}

export const Sidebar = ({
  isDarkMode,
  onResize,
  onCollapse,
  width = 256
}: SidebarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [testButtons, setTestButtons] = useState(['Test 1']);
  const [selectedTest, setSelectedTest] = useState('Test 1');
  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [playingTests, setPlayingTests] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(width);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(600, startWidth + deltaX)); // Allow expanding up to 600px
    
    if (newWidth <= 30) {
      // Collapse sidebar if dragged very close to left edge
      onCollapse?.();
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('dragging');
      return;
    }
    
    onResize?.(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('dragging');
  };

  const handleAddTest = () => {
    const nextTestNumber = testButtons.length + 1;
    const newTestName = `Test ${nextTestNumber}`;
    setTestButtons(prev => [...prev, newTestName]);
    // Remove automatic selection - keep current selection unchanged
  };

  const handleTestSelect = (testName: string) => {
    setSelectedTest(testName);
  };

  const handleTestNameClick = (e: React.MouseEvent, testName: string) => {
    e.stopPropagation(); // Prevent test selection when clicking on the name
    setEditingTest(testName);
    setEditingValue(testName);
  };

  const handleTestNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const handleTestNameBlur = () => {
    if (editingTest && editingValue.trim()) {
      setTestButtons(prev => prev.map(name => 
        name === editingTest ? editingValue.trim() : name
      ));
      // Update selected test if it was the one being edited
      if (selectedTest === editingTest) {
        setSelectedTest(editingValue.trim());
      }
    }
    setEditingTest(null);
    setEditingValue('');
  };

  const handleTestNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTestNameBlur();
    } else if (e.key === 'Escape') {
      setEditingTest(null);
      setEditingValue('');
    }
  };

  const handleDeleteTest = (e: React.MouseEvent, testName: string) => {
    e.stopPropagation(); // Prevent test selection when clicking delete
    
    // Remove the test from the list
    setTestButtons(prev => prev.filter(name => name !== testName));
    
    // Remove from playing tests if it was playing
    setPlayingTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(testName);
      return newSet;
    });
    
    // If the deleted test was selected, select the first remaining test
    if (selectedTest === testName) {
      const remainingTests = testButtons.filter(name => name !== testName);
      if (remainingTests.length > 0) {
        setSelectedTest(remainingTests[0]);
      }
    }
  };

  const handlePlayPause = (e: React.MouseEvent, testName: string) => {
    e.stopPropagation(); // Prevent test selection
    
    setPlayingTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testName)) {
        newSet.delete(testName); // Pause
      } else {
        newSet.add(testName); // Play
      }
      return newSet;
    });
  };

  const handleStop = (e: React.MouseEvent, testName: string) => {
    e.stopPropagation(); // Prevent test selection
    
    setPlayingTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(testName); // Stop (same as pause for now)
      return newSet;
    });
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startX, startWidth]);

  return (
    <aside 
      ref={sidebarRef}
      className="relative border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-200 flex flex-col"
      style={{ width: `${width}px` }}
    >
      <div className="p-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Simulations</h2>
          <div className="flex items-center space-x-1">
            <button 
              onClick={handleAddTest}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
            >
              <PlusIcon size={16} />
            </button>
            <button 
              onClick={onCollapse}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
            >
              <ChevronDownIcon size={16} />
            </button>
          </div>
        </div>
        <div className="mb-4 space-y-2">
          {testButtons.map((testName) => {
            const isPlaying = playingTests.has(testName);
            
            return (
              <div
                key={testName}
                className="group relative"
              >
                <button
                  onClick={() => handleTestSelect(testName)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 text-sm relative ${
                    selectedTest === testName
                      ? 'bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-gray-200'
                      : 'text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Test name and trash bin - left side */}
                  <div className="flex items-center space-x-2 pr-20">
                    {editingTest === testName ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={handleTestNameChange}
                          onBlur={handleTestNameBlur}
                          onKeyDown={handleTestNameKeyDown}
                          className="bg-transparent border-none outline-none min-w-0 text-inherit flex-1"
                          autoFocus
                        />
                        
                        {/* Trash bin icon - inline with text input */}
                        <button
                          onClick={(e) => handleDeleteTest(e, testName)}
                          className="opacity-100 transition-all duration-200 hover:scale-110 hover:text-red-500 dark:hover:text-red-400 text-gray-400 dark:text-gray-500 p-1 rounded w-6 h-6 flex items-center justify-center flex-shrink-0"
                          title="Delete test"
                        >
                          <Trash2Icon size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span 
                          onClick={(e) => handleTestNameClick(e, testName)}
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                          title="Click to edit name"
                        >
                          {testName}
                        </span>
                        
                        {/* Trash bin icon - inline with text */}
                        <button
                          onClick={(e) => handleDeleteTest(e, testName)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:text-red-500 dark:hover:text-red-400 text-gray-400 dark:text-gray-500 p-1 rounded w-6 h-6 flex items-center justify-center flex-shrink-0"
                          title="Delete test"
                        >
                          <Trash2Icon size={12} />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Play/Pause and Stop buttons - absolutely positioned on the right */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button
                      onClick={(e) => handlePlayPause(e, testName)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 text-gray-800 dark:text-gray-200 hover:scale-110"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <PauseIcon size={12} className="fill-current" />
                      ) : (
                        <PlayIcon size={12} className="fill-current" />
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => handleStop(e, testName)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 text-gray-800 dark:text-gray-200 hover:scale-110"
                      title="Stop"
                    >
                      <SquareIcon size={10} className="fill-current" />
                    </button>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        <div>
          <h2 className="text-sm font-medium mb-2">Chats</h2>
          {/* Chat items would go here */}
        </div>
      </div>
      
      {/* Drag handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
};