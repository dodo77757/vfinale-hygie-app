import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rect',
  width,
  height,
  className = ''
}) => {
  const baseClasses = 'animate-pulse bg-gray-800 rounded';
  
  const variantClasses = {
    card: 'rounded-3xl p-6',
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-label="Chargement en cours"
      role="status"
    />
  );
};

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  lines = 3
}) => {
  return (
    <div className="hud-card p-6 rounded-3xl bg-[#161616] border-gray-800 space-y-4">
      {showAvatar && (
        <div className="flex items-center gap-4">
          <SkeletonLoader variant="circle" width={64} height={64} />
          <div className="flex-1 space-y-2">
            <SkeletonLoader variant="text" width="60%" height={20} />
            <SkeletonLoader variant="text" width="40%" height={16} />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLoader
            key={i}
            variant="text"
            width={i === lines - 1 ? '80%' : '100%'}
            height={16}
          />
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <SkeletonLoader variant="rect" width="70%" height={40} />
        <SkeletonLoader variant="rect" width="30%" height={40} />
      </div>
    </div>
  );
};





