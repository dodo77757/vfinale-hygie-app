import React, { useState } from 'react';

interface HumanBodySVGProps {
  onBodyPartClick: (muscleGroup: string) => void;
}

// Mapping entre les parties du corps et les muscles dans la base de données
const BODY_PART_TO_MUSCLES: Record<string, string[]> = {
  'pectoraux': ['Pectoraux', 'Grand Pectoral', 'Petit Pectoral'],
  'deltoides': ['Deltoïde antérieur', 'Deltoïde ant', 'Deltoïde post', 'Deltoïde postérieur', 'DELTOIDE ANT', 'Supra'],
  'trapezes': ['Trapèze supérieur', 'Trapèze moy', 'Trapèze moyen', 'Trapèze inférieur'],
  'rhomboides': ['Rhomboïdes'],
  'biceps': ['Biceps'],
  'triceps': ['Triceps'],
  'abdos': ['Transverse de l\'abdomen', 'Core', 'Obliques', 'QL', 'Chaîne ant', 'Chaîne antérieure'],
  'fessiers': ['Fessier', 'Fessier moyen', 'FESSIER'],
  'quadriceps': ['Quadriceps', 'Quadri', 'Vaste Médial (VMO)'],
  'ischios': ['Ischio-jambiers', 'Ischio'],
  'mollets': ['Mollets', 'Mollets – Soléaire', 'Soléaire'],
  'adducteurs': ['Adducteurs'],
  'tibial': ['Tibial antérieur', 'Tibial ant', 'Tibial'],
  'peroniers': ['Péroniers', 'Péroniers latéraux'],
  'coiffe': ['Coiffe des rotateurs', 'Supra-épineux', 'Infra-épineux', 'Infra', 'Infraspinatus', 'Petit rond', 'INFRA-ÉPINEUX'],
  'denteles': ['Dentelé', 'DENTELÉ'],
  'multifides': ['Multifides'],
  'tfl': ['TFL'],
  'stabilite': ['Stabilité', 'Stabilité dynamique', 'Stabilité genou', 'Stabilité bassin', 'Stabilité', 'Bosu'],
};

// Noms affichés pour chaque partie du corps
const BODY_PART_LABELS: Record<string, string> = {
  'pectoraux': 'Pectoraux',
  'deltoides': 'Deltoïdes',
  'trapezes': 'Trapèzes',
  'rhomboides': 'Rhomboïdes',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'abdos': 'Abdominaux',
  'fessiers': 'Fessiers',
  'quadriceps': 'Quadriceps',
  'ischios': 'Ischio-jambiers',
  'mollets': 'Mollets',
  'adducteurs': 'Adducteurs',
  'tibial': 'Tibial antérieur',
  'peroniers': 'Péroniers',
  'coiffe': 'Coiffe des rotateurs',
  'denteles': 'Dentelés',
  'multifides': 'Multifides',
  'tfl': 'TFL',
  'stabilite': 'Stabilité',
};

// Couleurs distinctes pour chaque groupe musculaire avec dégradés
const BODY_PART_COLORS: Record<string, { default: string; hover: string; border: string; gradient: string }> = {
  'pectoraux': { default: '#3b82f6', hover: '#14b8a6', border: '#60a5fa', gradient: '#2563eb' },
  'deltoides': { default: '#8b5cf6', hover: '#14b8a6', border: '#a78bfa', gradient: '#7c3aed' },
  'trapezes': { default: '#6366f1', hover: '#14b8a6', border: '#818cf8', gradient: '#4f46e5' },
  'rhomboides': { default: '#4f46e5', hover: '#14b8a6', border: '#6366f1', gradient: '#4338ca' },
  'biceps': { default: '#ec4899', hover: '#14b8a6', border: '#f472b6', gradient: '#db2777' },
  'triceps': { default: '#f43f5e', hover: '#14b8a6', border: '#fb7185', gradient: '#e11d48' },
  'abdos': { default: '#10b981', hover: '#14b8a6', border: '#34d399', gradient: '#059669' },
  'fessiers': { default: '#f59e0b', hover: '#14b8a6', border: '#fbbf24', gradient: '#d97706' },
  'quadriceps': { default: '#ef4444', hover: '#14b8a6', border: '#f87171', gradient: '#dc2626' },
  'ischios': { default: '#dc2626', hover: '#14b8a6', border: '#ef4444', gradient: '#b91c1c' },
  'mollets': { default: '#ea580c', hover: '#14b8a6', border: '#fb923c', gradient: '#c2410c' },
  'adducteurs': { default: '#c2410c', hover: '#14b8a6', border: '#fdba74', gradient: '#9a3412' },
  'tibial': { default: '#d97706', hover: '#14b8a6', border: '#fbbf24', gradient: '#b45309' },
  'peroniers': { default: '#b45309', hover: '#14b8a6', border: '#fcd34d', gradient: '#92400e' },
  'coiffe': { default: '#7c3aed', hover: '#14b8a6', border: '#a78bfa', gradient: '#6d28d9' },
  'denteles': { default: '#5b21b6', hover: '#14b8a6', border: '#8b5cf6', gradient: '#4c1d95' },
  'multifides': { default: '#4338ca', hover: '#14b8a6', border: '#6366f1', gradient: '#3730a3' },
  'tfl': { default: '#059669', hover: '#14b8a6', border: '#10b981', gradient: '#047857' },
  'stabilite': { default: '#047857', hover: '#14b8a6', border: '#34d399', gradient: '#065f46' },
};

export const HumanBodySVG: React.FC<HumanBodySVGProps> = ({ onBodyPartClick }) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ part: string; x: number; y: number } | null>(null);
  const [view, setView] = useState<'anterior' | 'posterior' | 'lateral'>('anterior');

  const handleClick = (part: string) => {
    onBodyPartClick(part);
  };

  const handleMouseEnter = (part: string, event: React.MouseEvent<SVGElement>) => {
    setHoveredPart(part);
    const rect = event.currentTarget.getBoundingClientRect();
    const svg = event.currentTarget.ownerSVGElement;
    if (svg) {
      const svgRect = svg.getBoundingClientRect();
      setTooltip({
        part,
        x: rect.left - svgRect.left + rect.width / 2,
        y: rect.top - svgRect.top - 10,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPart(null);
    setTooltip(null);
  };

  const getColor = (part: string) => {
    const colors = BODY_PART_COLORS[part] || { default: '#4b5563', hover: '#14b8a6', border: '#6b7280', gradient: '#374151' };
    return hoveredPart === part ? colors.hover : colors.default;
  };

  const getBorderColor = (part: string) => {
    const colors = BODY_PART_COLORS[part] || { border: '#6b7280' };
    return hoveredPart === part ? colors.hover : colors.border;
  };

  const getGradientId = (part: string) => `gradient-${part}`;

  const renderMuscle = (
    part: string,
    path: string,
    opacity: number = 1
  ) => (
    <path
      d={path}
      fill={hoveredPart === part ? getColor(part) : `url(#${getGradientId(part)})`}
      stroke={getBorderColor(part)}
      strokeWidth={hoveredPart === part ? '3' : '2'}
      className="transition-all duration-200 cursor-pointer"
      onClick={() => handleClick(part)}
      onMouseEnter={(e) => handleMouseEnter(part, e)}
      onMouseLeave={handleMouseLeave}
      opacity={hoveredPart && hoveredPart !== part ? 0.25 : opacity}
      filter="url(#shadow)"
    />
  );

  const renderAnteriorView = () => (
    <g>
      {/* Tête - Forme plus réaliste */}
      <ellipse cx="200" cy="50" rx="32" ry="40" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      
      {/* Cou - Forme trapézoïdale anatomique */}
      <path d="M 168 90 L 178 90 L 222 90 L 232 90 L 232 125 L 200 130 L 168 125 Z" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      
      {/* Deltoïdes - Forme triangulaire anatomique */}
      {renderMuscle('deltoides', 'M 100 120 Q 85 130 80 145 Q 78 155 85 165 Q 92 170 105 168 Q 118 165 130 158 Q 140 150 135 138 Q 130 128 120 125 Z')}
      {renderMuscle('deltoides', 'M 300 120 Q 315 130 320 145 Q 322 155 315 165 Q 308 170 295 168 Q 282 165 270 158 Q 260 150 265 138 Q 270 128 280 125 Z')}
      
      {/* Coiffe des rotateurs */}
      <circle cx="110" cy="145" r="12" fill={hoveredPart === 'coiffe' ? getColor('coiffe') : `url(#${getGradientId('coiffe')})`} stroke={getBorderColor('coiffe')} strokeWidth={hoveredPart === 'coiffe' ? '3' : '2'} className="transition-all duration-200 cursor-pointer" onClick={() => handleClick('coiffe')} onMouseEnter={(e) => handleMouseEnter('coiffe', e)} onMouseLeave={handleMouseLeave} opacity={hoveredPart && hoveredPart !== 'coiffe' ? 0.25 : 1} />
      <circle cx="290" cy="145" r="12" fill={hoveredPart === 'coiffe' ? getColor('coiffe') : `url(#${getGradientId('coiffe')})`} stroke={getBorderColor('coiffe')} strokeWidth={hoveredPart === 'coiffe' ? '3' : '2'} className="transition-all duration-200 cursor-pointer" onClick={() => handleClick('coiffe')} onMouseEnter={(e) => handleMouseEnter('coiffe', e)} onMouseLeave={handleMouseLeave} opacity={hoveredPart && hoveredPart !== 'coiffe' ? 0.25 : 1} />
      
      {/* Pectoraux - Forme en éventail anatomique */}
      {renderMuscle('pectoraux', 'M 130 175 Q 110 195 125 220 Q 140 245 160 250 Q 180 252 200 250 Q 220 252 240 250 Q 260 245 275 220 Q 290 195 270 175 Q 250 165 230 170 Q 210 168 190 170 Q 170 168 150 170 Z')}
      
      {/* Dentelé antérieur (visible sous les pectoraux) */}
      {renderMuscle('denteles', 'M 160 240 Q 150 250 155 265 Q 160 275 170 275 Q 180 270 175 255 Z', 0.6)}
      {renderMuscle('denteles', 'M 240 240 Q 250 250 245 265 Q 240 275 230 275 Q 220 270 225 255 Z', 0.6)}
      
      {/* Biceps - Forme fusiforme anatomique */}
      {renderMuscle('biceps', 'M 125 255 Q 118 265 122 285 Q 128 305 138 325 Q 145 335 152 330 Q 158 310 155 290 Q 150 270 145 260 Z')}
      {renderMuscle('biceps', 'M 275 255 Q 282 265 278 285 Q 272 305 262 325 Q 255 335 248 330 Q 242 310 245 290 Q 250 270 255 260 Z')}
      
      {/* Triceps (partie visible antérieure) */}
      {renderMuscle('triceps', 'M 125 255 Q 120 270 125 290 Q 130 310 135 330 Q 140 340 145 335 Q 142 315 138 295 Q 135 275 132 260 Z', 0.7)}
      {renderMuscle('triceps', 'M 275 255 Q 280 270 275 290 Q 270 310 265 330 Q 260 340 255 335 Q 258 315 262 295 Q 265 275 268 260 Z', 0.7)}
      
      {/* Abdominaux - Rectus abdominis avec définition */}
      {renderMuscle('abdos', 'M 120 400 Q 110 415 115 435 Q 125 460 140 485 Q 155 495 165 490 Q 180 465 200 445 Q 220 465 240 490 Q 250 495 265 485 Q 280 460 290 435 Q 295 415 285 400 Q 270 390 250 395 Q 230 400 200 395 Q 170 400 150 395 Z')}
      
      {/* Obliques externes */}
      {renderMuscle('abdos', 'M 120 400 Q 110 420 115 450 Q 120 470 130 480 Q 140 475 135 455 Q 130 435 125 410 Z', 0.8)}
      {renderMuscle('abdos', 'M 280 400 Q 290 420 285 450 Q 280 470 270 480 Q 260 475 265 455 Q 270 435 275 410 Z', 0.8)}
      
      {/* Fessiers (partie antérieure visible) */}
      {renderMuscle('fessiers', 'M 140 520 Q 120 540 135 560 Q 150 575 170 575 Q 200 575 230 575 Q 250 575 265 560 Q 280 540 260 520 Q 240 510 220 515 Q 200 520 180 515 Q 160 510 140 520 Z', 0.7)}
      
      {/* Quadriceps - Forme anatomique avec 4 têtes */}
      {renderMuscle('quadriceps', 'M 145 600 Q 135 615 142 650 Q 150 685 162 720 Q 168 735 175 728 Q 172 695 168 660 Q 165 625 160 605 Z')}
      {renderMuscle('quadriceps', 'M 255 600 Q 265 615 258 650 Q 250 685 238 720 Q 232 735 225 728 Q 228 695 232 660 Q 235 625 240 605 Z')}
      
      {/* Vaste médial (VMO) - partie interne */}
      {renderMuscle('quadriceps', 'M 160 600 Q 155 620 160 650 Q 165 680 170 710 Q 173 720 176 715 Q 174 690 171 660 Q 168 630 165 610 Z', 0.8)}
      {renderMuscle('quadriceps', 'M 240 600 Q 245 620 240 650 Q 235 680 230 710 Q 227 720 224 715 Q 226 690 229 660 Q 232 630 235 610 Z', 0.8)}
      
      {/* Ischio-jambiers (partie visible antérieure) */}
      {renderMuscle('ischios', 'M 150 600 Q 148 620 152 650 Q 156 680 160 710 Q 163 730 166 725 Q 164 700 161 670 Q 158 640 155 615 Z', 0.6)}
      {renderMuscle('ischios', 'M 250 600 Q 252 620 248 650 Q 244 680 240 710 Q 237 730 234 725 Q 236 700 239 670 Q 242 640 245 615 Z', 0.6)}
      
      {/* Tibial antérieur - Forme fusiforme */}
      {renderMuscle('tibial', 'M 155 750 Q 150 760 152 780 Q 155 800 160 810 Q 165 815 168 808 Q 166 790 163 770 Q 160 755 158 750 Z')}
      {renderMuscle('tibial', 'M 245 750 Q 250 760 248 780 Q 245 800 240 810 Q 235 815 232 808 Q 234 790 237 770 Q 240 755 242 750 Z')}
      
      {/* Mollets - Gastrocnemius et Soleus */}
      {renderMuscle('mollets', 'M 150 750 Q 145 765 148 785 Q 152 805 158 820 Q 163 830 168 825 Q 165 805 162 785 Q 158 765 155 755 Z')}
      {renderMuscle('mollets', 'M 250 750 Q 255 765 252 785 Q 248 805 242 820 Q 237 830 232 825 Q 235 805 238 785 Q 242 765 245 755 Z')}
      
      {/* Péroniers */}
      <ellipse cx="160" cy="770" rx="6" ry="25" fill={hoveredPart === 'peroniers' ? getColor('peroniers') : `url(#${getGradientId('peroniers')})`} stroke={getBorderColor('peroniers')} strokeWidth={hoveredPart === 'peroniers' ? '3' : '2'} className="transition-all duration-200 cursor-pointer" onClick={() => handleClick('peroniers')} onMouseEnter={(e) => handleMouseEnter('peroniers', e)} onMouseLeave={handleMouseLeave} opacity={hoveredPart && hoveredPart !== 'peroniers' ? 0.25 : 1} />
      <ellipse cx="240" cy="770" rx="6" ry="25" fill={hoveredPart === 'peroniers' ? getColor('peroniers') : `url(#${getGradientId('peroniers')})`} stroke={getBorderColor('peroniers')} strokeWidth={hoveredPart === 'peroniers' ? '3' : '2'} className="transition-all duration-200 cursor-pointer" onClick={() => handleClick('peroniers')} onMouseEnter={(e) => handleMouseEnter('peroniers', e)} onMouseLeave={handleMouseLeave} opacity={hoveredPart && hoveredPart !== 'peroniers' ? 0.25 : 1} />
    </g>
  );

  const renderPosteriorView = () => (
    <g>
      {/* Tête */}
      <ellipse cx="200" cy="50" rx="32" ry="40" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      
      {/* Cou */}
      <path d="M 168 90 L 178 90 L 222 90 L 232 90 L 232 125 L 200 130 L 168 125 Z" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      
      {/* Trapèzes - Forme en losange anatomique */}
      {renderMuscle('trapezes', 'M 150 105 Q 130 115 140 135 Q 150 155 170 160 Q 200 165 230 160 Q 250 155 260 135 Q 270 115 250 105 Q 230 100 200 102 Q 170 100 150 105 Z')}
      
      {/* Deltoïdes postérieurs */}
      {renderMuscle('deltoides', 'M 100 120 Q 85 130 80 145 Q 78 155 85 165 Q 92 170 105 168 Q 118 165 130 158 Q 140 150 135 138 Q 130 128 120 125 Z')}
      {renderMuscle('deltoides', 'M 300 120 Q 315 130 320 145 Q 322 155 315 165 Q 308 170 295 168 Q 282 165 270 158 Q 260 150 265 138 Q 270 128 280 125 Z')}
      
      {/* Rhomboïdes - Entre les omoplates */}
      {renderMuscle('rhomboides', 'M 160 180 Q 145 200 155 230 Q 165 250 185 255 Q 200 258 215 255 Q 235 250 245 230 Q 255 200 240 180 Q 220 170 200 172 Q 180 170 160 180 Z')}
      
      {/* Latissimus dorsi - Grand dorsal */}
      {renderMuscle('rhomboides', 'M 140 250 Q 120 280 135 320 Q 150 360 170 380 Q 200 390 230 380 Q 250 360 265 320 Q 280 280 260 250 Q 240 235 220 240 Q 200 238 180 240 Q 160 235 140 250 Z', 0.8)}
      
      {/* Triceps - Forme en fer à cheval */}
      {renderMuscle('triceps', 'M 120 260 Q 115 275 118 295 Q 122 315 128 335 Q 135 350 142 345 Q 138 325 135 305 Q 132 285 128 270 Z')}
      {renderMuscle('triceps', 'M 280 260 Q 285 275 282 295 Q 278 315 272 335 Q 265 350 258 345 Q 262 325 265 305 Q 268 285 272 270 Z')}
      
      {/* Tête longue du triceps */}
      {renderMuscle('triceps', 'M 120 260 Q 115 280 120 300 Q 125 320 130 340 Q 135 355 140 350 Q 137 330 133 310 Q 130 290 127 275 Z', 0.9)}
      {renderMuscle('triceps', 'M 280 260 Q 285 280 280 300 Q 275 320 270 340 Q 265 355 260 350 Q 263 330 267 310 Q 270 290 273 275 Z', 0.9)}
      
      {/* Fessiers - Gluteus maximus anatomique */}
      {renderMuscle('fessiers', 'M 120 510 Q 100 530 115 555 Q 130 580 150 585 Q 200 590 250 585 Q 270 580 285 555 Q 300 530 280 510 Q 260 500 240 505 Q 200 510 160 505 Q 140 500 120 510 Z')}
      
      {/* Gluteus medius (partie supérieure) */}
      {renderMuscle('fessiers', 'M 140 510 Q 125 520 135 540 Q 145 555 160 558 Q 200 560 240 558 Q 255 555 265 540 Q 275 520 260 510 Q 240 505 220 507 Q 200 505 180 507 Q 160 505 140 510 Z', 0.8)}
      
      {/* Ischio-jambiers - Forme anatomique avec 3 muscles */}
      {renderMuscle('ischios', 'M 140 600 Q 135 620 140 655 Q 146 690 152 720 Q 158 745 165 740 Q 162 710 158 680 Q 154 650 150 625 Z')}
      {renderMuscle('ischios', 'M 260 600 Q 265 620 260 655 Q 254 690 248 720 Q 242 745 235 740 Q 238 710 242 680 Q 246 650 250 625 Z')}
      
      {/* Biceps femoris (tête latérale) */}
      {renderMuscle('ischios', 'M 140 600 Q 138 625 142 660 Q 147 695 152 725 Q 157 740 162 735 Q 159 705 155 675 Q 151 645 148 620 Z', 0.9)}
      {renderMuscle('ischios', 'M 260 600 Q 262 625 258 660 Q 253 695 248 725 Q 243 740 238 735 Q 241 705 245 675 Q 249 645 252 620 Z', 0.9)}
      
      {/* Semitendinosus/Semimembranosus (tête médiale) */}
      {renderMuscle('ischios', 'M 150 600 Q 148 625 151 660 Q 155 695 160 725 Q 165 740 170 735 Q 167 705 163 675 Q 159 645 156 620 Z', 0.85)}
      {renderMuscle('ischios', 'M 250 600 Q 252 625 249 660 Q 245 695 240 725 Q 235 740 230 735 Q 233 705 237 675 Q 241 645 244 620 Z', 0.85)}
      
      {/* Mollets - Gastrocnemius et Soleus */}
      {renderMuscle('mollets', 'M 140 750 Q 135 770 140 790 Q 146 810 152 825 Q 158 835 165 830 Q 160 810 156 790 Q 152 770 148 755 Z')}
      {renderMuscle('mollets', 'M 260 750 Q 265 770 260 790 Q 254 810 248 825 Q 242 835 235 830 Q 240 810 244 790 Q 248 770 252 755 Z')}
      
      {/* Soleus (sous le gastrocnemius) */}
      {renderMuscle('mollets', 'M 145 780 Q 142 800 146 820 Q 150 835 155 840 Q 160 838 157 818 Q 154 798 151 785 Z', 0.8)}
      {renderMuscle('mollets', 'M 255 780 Q 258 800 254 820 Q 250 835 245 840 Q 240 838 243 818 Q 246 798 249 785 Z', 0.8)}
      
      {/* Tendon d'Achille */}
      <path d="M 150 820 Q 148 830 150 840 Q 152 845 155 843 Q 153 835 152 828 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" opacity={0.7} />
      <path d="M 250 820 Q 252 830 250 840 Q 248 845 245 843 Q 247 835 248 828 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" opacity={0.7} />
    </g>
  );

  const renderLateralView = () => (
    <g>
      {/* Tête */}
      <ellipse cx="200" cy="50" rx="32" ry="40" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      
      {/* Cou */}
      <path d="M 185 90 L 195 90 L 205 90 L 215 90 L 215 125 L 200 130 L 185 125 Z" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      
      {/* Deltoïde (vue latérale) */}
      {renderMuscle('deltoides', 'M 180 120 Q 165 130 160 145 Q 158 155 165 165 Q 172 170 185 168 Q 198 165 210 158 Q 220 150 215 138 Q 210 128 200 125 Z')}
      
      {/* Trapèze (partie supérieure visible) */}
      {renderMuscle('trapezes', 'M 180 105 Q 170 115 175 135 Q 180 150 190 155 Q 200 157 210 155 Q 220 150 225 135 Q 230 115 220 105 Q 210 100 200 102 Q 190 100 180 105 Z', 0.7)}
      
      {/* Pectoraux (partie supérieure visible) */}
      {renderMuscle('pectoraux', 'M 200 175 Q 180 195 195 220 Q 210 240 230 245 Q 240 247 250 240 Q 250 220 245 200 Q 235 185 220 190 Q 210 188 200 190 Z', 0.8)}
      
      {/* Latissimus dorsi (grand dorsal) */}
      {renderMuscle('rhomboides', 'M 180 200 Q 160 230 175 270 Q 190 310 210 340 Q 220 350 230 345 Q 215 315 205 280 Q 195 245 200 220 Z')}
      
      {/* Serratus anterior (dentelé antérieur) */}
      {renderMuscle('denteles', 'M 200 240 Q 190 250 195 270 Q 200 285 210 290 Q 220 285 215 265 Q 210 250 205 245 Z', 0.7)}
      
      {/* Obliques externes */}
      {renderMuscle('abdos', 'M 200 400 Q 190 420 195 450 Q 200 470 210 480 Q 220 485 230 480 Q 225 460 220 440 Q 215 420 210 405 Z')}
      
      {/* Fessiers (vue latérale) */}
      {renderMuscle('fessiers', 'M 200 510 Q 180 530 195 555 Q 210 575 230 580 Q 240 582 250 575 Q 250 550 245 530 Q 235 515 225 520 Q 215 518 205 520 Z')}
      
      {/* TFL (Tensor Fasciae Latae) */}
      {renderMuscle('tfl', 'M 200 510 Q 195 525 198 545 Q 202 560 208 565 Q 215 563 212 548 Q 209 533 206 520 Z', 0.7)}
      
      {/* Quadriceps (vue latérale) - Vastus lateralis */}
      {renderMuscle('quadriceps', 'M 200 600 Q 190 615 198 650 Q 206 685 216 720 Q 221 735 228 730 Q 223 695 217 660 Q 212 625 207 605 Z')}
      
      {/* Rectus femoris (partie antérieure) */}
      {renderMuscle('quadriceps', 'M 200 600 Q 195 620 200 650 Q 205 680 210 710 Q 213 720 216 715 Q 214 690 211 660 Q 208 630 205 610 Z', 0.85)}
      
      {/* Ischio-jambiers (vue latérale) */}
      {renderMuscle('ischios', 'M 200 600 Q 198 620 201 650 Q 205 680 210 710 Q 215 735 220 730 Q 217 700 213 670 Q 210 640 207 615 Z')}
      
      {/* Biceps femoris (tête latérale) */}
      {renderMuscle('ischios', 'M 200 600 Q 197 625 200 660 Q 204 695 209 725 Q 214 740 219 735 Q 216 705 212 675 Q 209 645 206 620 Z', 0.9)}
      
      {/* Tibial antérieur (vue latérale) */}
      {renderMuscle('tibial', 'M 200 750 Q 195 760 198 780 Q 202 800 208 810 Q 213 815 218 810 Q 214 790 211 770 Q 208 755 205 750 Z')}
      
      {/* Mollets - Gastrocnemius (vue latérale) */}
      {renderMuscle('mollets', 'M 200 750 Q 195 770 198 790 Q 202 810 208 825 Q 213 835 220 830 Q 216 810 212 790 Q 208 770 204 755 Z')}
      
      {/* Soleus (sous le gastrocnemius) */}
      {renderMuscle('mollets', 'M 202 780 Q 200 800 203 820 Q 206 835 211 840 Q 216 838 213 818 Q 210 798 207 785 Z', 0.8)}
      
      {/* Tendon d'Achille (vue latérale) */}
      <path d="M 205 820 Q 203 830 205 840 Q 207 845 210 843 Q 208 835 207 828 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" opacity={0.7} />
    </g>
  );

  return (
    <div className="flex flex-col items-center justify-center p-2 relative">
      {/* Sélecteur de vue */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('anterior')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bebas uppercase transition-all ${
            view === 'anterior' 
              ? 'bg-[var(--primary-teal)] text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Avant
        </button>
        <button
          onClick={() => setView('posterior')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bebas uppercase transition-all ${
            view === 'posterior' 
              ? 'bg-[var(--primary-teal)] text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Arrière
        </button>
        <button
          onClick={() => setView('lateral')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bebas uppercase transition-all ${
            view === 'lateral' 
              ? 'bg-[var(--primary-teal)] text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Côté
        </button>
      </div>

      <svg
        viewBox="0 0 400 850"
        className="w-full max-w-sm h-auto"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))' }}
      >
        <defs>
          {/* Dégradés pour chaque groupe musculaire */}
          {Object.keys(BODY_PART_COLORS).map((part) => {
            const colors = BODY_PART_COLORS[part];
            return (
              <linearGradient key={part} id={getGradientId(part)} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.default} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors.gradient} stopOpacity="0.7" />
              </linearGradient>
            );
          })}
          {/* Ombre portée */}
          <filter id="shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rendu de la vue sélectionnée */}
        {view === 'anterior' && renderAnteriorView()}
        {view === 'posterior' && renderPosteriorView()}
        {view === 'lateral' && renderLateralView()}

        {/* Tooltip amélioré */}
        {tooltip && hoveredPart && (
          <g>
            <defs>
              <filter id="tooltip-shadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect
              x={tooltip.x - 70}
              y={tooltip.y - 35}
              width="140"
              height="30"
              rx="8"
              fill="#14b8a6"
              opacity="0.95"
              className="pointer-events-none"
              filter="url(#tooltip-shadow)"
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 12}
              textAnchor="middle"
              fill="white"
              fontSize="13"
              fontWeight="bold"
              className="pointer-events-none font-bebas"
            >
              {BODY_PART_LABELS[hoveredPart] || hoveredPart}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export { BODY_PART_TO_MUSCLES };
