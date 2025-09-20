import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'pixel-button';
  
  const variantClasses = {
    primary: disabled ? '' : 'hover:border-pixel-pink hover:text-pixel-pink',
    secondary: disabled ? '' : 'hover:border-pixel-pink hover:text-pixel-pink',
    accent: disabled ? '' : 'hover:border-pixel-pink hover:text-pixel-pink selected',
  };
  
  const sizeClasses = {
    small: 'px-3 py-2 text-xs',
    medium: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
