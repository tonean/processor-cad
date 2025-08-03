import React from 'react';
export const Logo = () => {
  return <div className="w-8 h-8 rounded flex items-center justify-center">
      <div className="w-6 h-6 rounded-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-300 rounded-tl-sm"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-yellow-200 rounded-tr-sm"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-pink-300 rounded-bl-sm"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-purple-300 rounded-br-sm"></div>
      </div>
    </div>;
};