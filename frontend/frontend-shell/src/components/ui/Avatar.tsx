import React from 'react';
import { User } from 'lucide-react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
};

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  className,
  onClick,
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  const showInitials = !src || imageError;
  const initials = name ? getInitials(name) : '';
  const avatarColor = name ? getAvatarColor(name) : 'bg-gray-500';

  return (
    <div 
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        sizeClasses[size],
        showInitials ? `${avatarColor} text-white font-medium` : '',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : initials ? (
        <span className="select-none">{initials}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-gray-400" />
      )}
      
      {status && (
        <div
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900',
            statusClasses[status],
            size === 'xs' ? 'w-2 h-2' :
            size === 'sm' ? 'w-2.5 h-2.5' :
            size === 'md' ? 'w-3 h-3' :
            size === 'lg' ? 'w-4 h-4' :
            'w-5 h-5'
          )}
        />
      )}
    </div>
  );
};
