import React, { memo } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = memo(({ current, total }) => {
  const progress = (current / total) * 100;
  return (
    <div 
      className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-[60]"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Progression: ${current} sur ${total}`}
    >
      <div 
        className="h-full bg-[var(--primary-teal)] shadow-[0_0_10px_var(--primary-teal)] transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';


