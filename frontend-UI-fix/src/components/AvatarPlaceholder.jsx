import React from 'react';
import { User } from 'lucide-react';
import { API_BASE_URL } from '../api';

export function AvatarPlaceholder({ size = 40, className = '', src = null }) {
  // Pastikan src bukan string kosong atau "null"
  const hasImage = src && src !== "" && src !== "null";

  if (hasImage) {
    const fullSrc = src.startsWith('http') ? src : `${API_BASE_URL}${src}`;
    return (
      <div 
        className={`rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={fullSrc}
          alt="Profile"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://ui-avatars.com/api/?name=User&background=random';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.5} className="text-gray-300" />
    </div>
  );
}
