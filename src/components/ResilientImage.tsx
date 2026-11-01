import React, { useState } from 'react';
import { Compass } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1F4D3A] via-[#2A5E48] to-[#D9734E]/80 text-[#F7F5F0] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Compass className="w-8 h-8 mb-2 opacity-85" aria-hidden="true" />
        {fallbackTitle && (
          <span className="font-display text-base font-medium tracking-tight opacity-95">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
