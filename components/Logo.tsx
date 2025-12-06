
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-32 h-auto" }) => {
  return (
    <svg 
        viewBox="0 0 200 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        aria-label="Annabella Bridal"
    >
      {/* Annabella - Siyah/Koyu Gri */}
      <text x="0" y="30" fontFamily="'Playfair Display', serif" fontSize="28" fontWeight="bold" fill="#111827">
        Annabella
      </text>
      
      <circle cx="145" cy="12" r="3" fill="#D34A7D" />
      
      {/* Blog - Pembe */}
      <text x="135" y="30" fontFamily="'Lato', sans-serif" fontSize="28" fontWeight="300" fill="#D34A7D">
        Blog
      </text>
    </svg>
  );
};
