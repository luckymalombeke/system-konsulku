import React from 'react';
import { User } from 'lucide-react';

export function AvatarPlaceholder({ size = 40, className = '' }) {
  return (
    <div
      className={`rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.5} className="text-gray-400" />
    </div>
  );
}
