
import React from 'react';

interface LogoProps {
  className?: string;
  isInverse?: boolean; // Karanlık modda beyazlatmak için opsiyonel
}

export const Logo: React.FC<LogoProps> = ({ className = "h-12 w-auto", isInverse = false }) => {
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
        {/* Kullanıcının sağladığı logoyu kullanıyoruz */}
        <img 
            src="https://storage.googleapis.com/a1aa/image/Vq3L4N4_L-0L2Wn-0vN_G_T_H_B_Y_E.png" 
            alt="Annabella Bridal" 
            className={`h-full w-auto object-contain transition-all duration-300 dark:brightness-0 dark:invert ${isInverse ? 'brightness-0 invert' : ''}`}
            onError={(e) => {
                // Eğer URL bir şekilde bozulursa fallback text göster
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="font-serif font-bold text-wedding-500">ANNABELLA</span>';
            }}
        />
        <span className="font-sans font-light text-[10px] tracking-[0.4em] text-wedding-500 dark:text-wedding-300 mt-2 ml-2 hidden sm:block">BLOG</span>
    </div>
  );
};
