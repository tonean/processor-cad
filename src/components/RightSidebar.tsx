import React, { useState, useRef, useEffect } from 'react';
import { MessageSquareIcon, PlusIcon, ChevronDownIcon, ImageIcon, MousePointerIcon, SlashIcon, Grid3X3Icon, ClockIcon, ArrowUpIcon, CodeIcon, BotIcon, UserIcon, FileTextIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onResize?: (width: number) => void;
  onCollapse?: () => void;
  width?: number;
  onAddMessage?: (message: Message) => void;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface SelectedFile {
  id: string;
  name: string;
  size: string;
  url: string;
  type: string;
}

export const RightSidebar = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  onResize, 
  onCollapse, 
  width = 256,
  onAddMessage
}: RightSidebarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'data'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      content: import.meta.env.VITE_GEMINI_API_KEY 
        ? "Hello! I'm your CAD assistant. I can help you with design questions, parametric modeling, assembly constraints, 3D printing optimization, and more. What would you like to work on today?"
        : "Hello! I'm your CAD assistant, but I'm currently in demo mode. The API key is not configured. Please check your environment variables.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to add messages from external sources (like modal)
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  // Expose addMessage function to parent component
  useEffect(() => {
    if (onAddMessage) {
      // Create a function that can be called from parent
      const addMessageToChat = (message: Message) => {
        addMessage(message);
      };
      
      // Store it in a way that parent can access
      (window as any).addMessageToChat = addMessageToChat;
    }
  }, [onAddMessage]);

  console.log('RightSidebar rendering, isOpen:', isOpen);
  console.log('Environment check - API key exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log('Environment check - API key length:', import.meta.env.VITE_GEMINI_API_KEY?.length || 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          
          // Create file object
          const fileObject: SelectedFile = {
            id: Date.now().toString(),
            name: file.name,
            size: formatFileSize(file.size),
            url: imageUrl,
            type: file.type
          };
          
          // Add to selected files
          setSelectedFiles(prev => [...prev, fileObject]);
        };
        reader.readAsDataURL(file);
      } else {
        // Show error for non-image files
        const errorMessage: Message = {
          id: Date.now(),
          sender: 'bot',
          content: 'Please select an image file (JPEG, PNG, GIF, etc.).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const convertTextToPDF = async (text: string): Promise<SelectedFile> => {
    // Create a more realistic PDF representation
    const lines = text.split('\n');
    const formattedText = lines.map(line => line.trim()).filter(line => line.length > 0).join('\n');
    
    // Create a simple PDF-like blob (in real implementation, you'd use a PDF library)
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${formattedText.length + 100}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${formattedText.substring(0, 100)}...) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${formattedText.length + 300}
%%EOF`;
    
    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    return {
      id: Date.now().toString(),
      name: `document_${new Date().toISOString().slice(0, 10)}.pdf`,
      size: formatFileSize(pdfContent.length),
      url: pdfUrl,
      type: 'application/pdf'
    };
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    
    // If pasted text is longer than 200 characters, convert to PDF
    if (pastedText.length > 200) {
      e.preventDefault(); // Prevent pasting into textarea
      
      try {
        const pdfFile = await convertTextToPDF(pastedText);
        setSelectedFiles(prev => [...prev, pdfFile]);
      } catch (error) {
        console.error('Error converting text to PDF:', error);
      }
    }
    // If short text, let it paste normally into textarea
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: inputValue.trim() || `Sent ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedFiles([]); // Clear selected files after sending
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('API Key available:', !!apiKey);
      
      if (!apiKey) {
        throw new Error('API key not found in environment variables');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful CAD (Computer-Aided Design) assistant. You help users with design questions, parametric modeling, assembly constraints, 3D printing optimization, and other CAD-related topics. Keep your responses concise and practical. User message: ${inputValue.trim() || `User sent ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}`}`
            }]
          }]
        })
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const botMessage: Message = {
          id: Date.now() + 1,
          sender: 'bot',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        content: `Sorry, I'm having trouble connecting right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    
    const deltaX = startX - e.clientX; // Inverted for right sidebar
    const newWidth = Math.max(200, Math.min(600, startWidth + deltaX)); // Allow expanding up to 600px
    
    console.log('Right sidebar drag:', { deltaX, newWidth, startWidth, startX, clientX: e.clientX });
    
    // For right sidebar, dragging right (positive deltaX) makes it smaller
    // We need to check if it's getting very narrow
    if (newWidth <= 30) {
      console.log('Collapsing right sidebar');
      // Collapse sidebar if dragged very close to right edge
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

  if (!isOpen) return null;

  return (
    <aside 
      ref={sidebarRef}
      className="relative border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-200 flex flex-col z-50"
      style={{ width: `${width}px` }}
    >
        <div className="p-3 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Results</h2>
            <button 
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
            >
              <ChevronDownIcon size={16} />
            </button>
          </div>
          
          {/* Tab Interface */}
          <div className="flex items-center space-x-1 mb-3 p-1 rounded-md">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                activeTab === 'chat'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <MessageSquareIcon size={14} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                activeTab === 'data'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <CodeIcon size={14} />
              <span>Data</span>
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'chat' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'bot' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}>
                      {message.sender === 'bot' ? (
                        <BotIcon size={12} />
                      ) : (
                        <UserIcon size={12} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {message.sender === 'bot' ? 'Assistant' : 'You'} • {message.timestamp}
                      </p>
                      <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {message.sender === 'bot' ? (
                          <ReactMarkdown 
                            components={{
                              p: ({children}) => <p className="mb-2 last:mb-0 text-sm text-gray-800 dark:text-gray-200">{children}</p>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                              code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">{children}</code>,
                              pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="text-sm">{children}</li>,
                              h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">{children}</blockquote>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      <BotIcon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Assistant • typing...
                      </p>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center mt-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Input field at the bottom */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {/* File previews */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {selectedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
                    ) : file.type === 'application/pdf' ? (
                      <FileTextIcon size={16} className="text-gray-500 dark:text-gray-400" />
                    ) : (
                      <FileTextIcon size={16} className="text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.size}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onPaste={handlePaste}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-300 disabled:opacity-50 resize-none overflow-hidden"
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
              onFocus={(e) => {
                const isDark = document.documentElement.classList.contains('dark');
                const bgColor = isDark ? '#1f2937' : 'white';
                e.target.style.background = `linear-gradient(${bgColor}, ${bgColor}) padding-box, linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd) border-box`;
                e.target.style.border = '2px solid transparent';
                e.target.style.backgroundSize = '400% 400%';
                e.target.style.animation = 'gradientShift 3s ease infinite';
              }}
              onBlur={(e) => {
                e.target.style.background = '';
                e.target.style.border = '';
                e.target.style.backgroundSize = '';
                e.target.style.animation = '';
              }}
            />
            <button 
              onClick={sendMessage}
              disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading}
              className="absolute right-3 bottom-3 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpIcon size={16} />
            </button>
          </div>
          
          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Icons row below input */}
          <div className="flex items-center space-x-4 mt-3">
            <button 
              onClick={handleImageUpload}
              className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
              title="Upload image"
            >
              <ImageIcon size={16} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
              <MousePointerIcon size={16} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
              <SlashIcon size={16} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
              <Grid3X3Icon size={16} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200">
              <ClockIcon size={16} />
            </button>
          </div>
        </div>
        
        {/* Drag handle */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-4 cursor-col-resize select-none"
          onMouseDown={handleMouseDown}
        />
      </aside>
    );
}; 