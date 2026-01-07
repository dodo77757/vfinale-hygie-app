import React, { useState } from 'react';

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="w-5 h-5 rounded-full bg-[#BAE6FD] text-[#1F2937] flex items-center justify-center text-xs font-bold hover:bg-[#7DD3FC] transition-colors"
        aria-label="Information"
      >
        ?
      </button>
      {isVisible && (
        <div className={`absolute ${positionClasses[position]} z-50 w-48 p-3 bg-white border-2 border-[#BAE6FD] rounded-lg shadow-xl text-xs text-[#1F2937] font-medium`}>
          {content}
          <div className={`absolute ${position === 'top' ? 'top-full' : position === 'bottom' ? 'bottom-full' : position === 'left' ? 'left-full' : 'right-full'} ${position === 'top' || position === 'bottom' ? 'left-1/2 transform -translate-x-1/2' : 'top-1/2 transform -translate-y-1/2'} w-0 h-0 border-4 border-transparent ${position === 'top' ? 'border-t-[#BAE6FD]' : position === 'bottom' ? 'border-b-[#BAE6FD]' : position === 'left' ? 'border-l-[#BAE6FD]' : 'border-r-[#BAE6FD]'}`} />
        </div>
      )}
    </div>
  );
};


