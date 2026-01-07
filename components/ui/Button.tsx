import React, { ButtonHTMLAttributes } from 'react';
import { Tooltip } from './Tooltip';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  tooltip?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  tooltip,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'font-bebas uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] focus:ring-offset-2 focus:ring-offset-black';
  
  const variantClasses = {
    primary: 'bg-[var(--primary-gold)] text-black hover:bg-amber-500 active:bg-amber-600 disabled:bg-gray-800 disabled:text-gray-500',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600 disabled:bg-gray-900 disabled:text-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500',
    ghost: 'border border-gray-700 text-gray-300 hover:border-[var(--primary-teal)] hover:text-[var(--primary-teal)] active:bg-gray-800 disabled:border-gray-800 disabled:text-gray-600'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const button = (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Chargement...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
};

