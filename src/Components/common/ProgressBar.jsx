import React from 'react';

const ProgressBar = ({ progress, label }) => {
  return (
    <div className="flex items-center gap-4 w-full mb-4">
      <span className="text-sm text-gray-600 w-48 whitespace-nowrap">{label}</span>
      <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 w-12">{Math.round(progress)}%</span>
    </div>
  );
};

export default ProgressBar;