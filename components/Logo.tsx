
import React from 'react';

interface LogoProps {
  className?: string;
  isInverse?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-12 w-auto" }) => {
  return (
    <div className={`flex items-baseline gap-1 group cursor-pointer transition-transform duration-300 hover:scale-105 ${className}`}>
        {/* Kullanıcının sağladığı AB Logosu - Filtreler kaldırıldı, her zaman orijinal renkler */}
        <img 
            src="https://cdn.shopify.com/s/files/1/0733/2285/6611/files/FAV-CENTER-LOGO-1.png?v=1770124550" 
            alt="Annabella Bridal" 
            className="h-full w-auto object-contain transition-all duration-300"
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                   e.currentTarget.parentElement.innerHTML = '<span class="font-serif font-bold text-wedding-500">ANNABELLA</span>';
                }
            }}
        />
        <span className="font-sans font-light text-[10px] tracking-[0.4em] text-wedding-500 dark:text-wedding-300 mt-2 ml-2 hidden sm:block group-hover:text-wedding-900 transition-colors">BLOG</span>
    </div>
  );
};
