import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = '⮕'
}) => {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs font-mono">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-gray-600 mx-1" aria-hidden="true">
                {separator}
              </span>
            )}
            {isLast ? (
              <span className="text-[var(--primary-gold)] uppercase" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="text-gray-400 hover:text-[var(--primary-teal)] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] rounded"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

