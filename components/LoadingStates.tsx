import React from 'react';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  stage?: string;
}

/**
 * Composant de chargement avec message personnalisé
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'TRAITEMENT NEURAL...',
  progress,
  stage
}) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
      <div className="w-16 h-16 border-4 border-[var(--primary-teal)] border-t-transparent rounded-full animate-spin mb-6" />
      <p className="font-bebas text-2xl text-white tracking-[0.5em] animate-pulse mb-4">
        {stage || message}
      </p>
      {progress !== undefined && progress > 0 && (
        <div className="w-64 max-w-xs">
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div
              className="bg-[var(--primary-teal)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-mono text-gray-400 text-center">{progress}%</p>
        </div>
      )}
    </div>
  );
};

/**
 * Spinner simple pour les chargements rapides
 */
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-[var(--primary-teal)] border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Chargement en cours"
    />
  );
};

