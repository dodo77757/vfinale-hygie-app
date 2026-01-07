import React from 'react';

interface HygieLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const HygieLogo: React.FC<HygieLogoProps> = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: { container: 64, circle: 20 },
    medium: { container: 96, circle: 30 },
    large: { container: 128, circle: 40 }
  };

  const { container, circle } = sizes[size];
  const radius = circle / 2;

  return (
    <svg
      width={container}
      height={container}
      viewBox={`0 0 ${container} ${container}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient élégant pour le cercle gris */}
        <radialGradient id="grayGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#F3F4F6" stopOpacity="1" />
          <stop offset="100%" stopColor="#D1D5DB" stopOpacity="1" />
        </radialGradient>
        
        {/* Gradient élégant pour le cercle teal */}
        <radialGradient id="tealGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="1" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="1" />
        </radialGradient>
        
        {/* Gradient élégant pour le cercle jaune */}
        <radialGradient id="yellowGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="1" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="1" />
        </radialGradient>
        
        {/* Ombre douce pour chaque cercle */}
        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Cercle gris clair - bas à gauche : 1/3 depuis le bas, 1/3 depuis la gauche */}
      <circle
        cx={container * 0.333}
        cy={container * 0.667}
        r={radius}
        fill="url(#grayGradient)"
        filter="url(#softShadow)"
        style={{ transition: 'all 0.3s ease' }}
      />
      
      {/* Cercle bleu/teal - haut à droite : 1/4 depuis le haut, 1/4 depuis la droite */}
      <circle
        cx={container * 0.75}
        cy={container * 0.25}
        r={radius}
        fill="url(#tealGradient)"
        filter="url(#softShadow)"
        style={{ transition: 'all 0.3s ease' }}
      />
      
      {/* Cercle jaune vif - milieu à droite : 50% hauteur, 1/5 (20%) depuis la droite */}
      <circle
        cx={container * 0.80}
        cy={container * 0.50}
        r={radius}
        fill="url(#yellowGradient)"
        filter="url(#softShadow)"
        style={{ transition: 'all 0.3s ease' }}
      />
    </svg>
  );
};

