
import React from 'react';
import { Logo } from './Logo';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f9f6f5] dark:bg-[#1a1614] transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-wedding-100/40 dark:bg-wedding-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-wedding-200/40 dark:bg-wedding-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative flex flex-col items-center animate-fadeIn">
        {/* Animated Brand Symbol */}
        <div className="relative w-32 h-32 mb-12">
          {/* Botanical pulse circles */}
          <div className="absolute inset-0 border border-wedding-200 dark:border-wedding-900 rounded-full animate-ping opacity-30"></div>
          <div className="absolute inset-4 border border-wedding-300 dark:border-wedding-800 rounded-full animate-pulse [animation-duration:2.5s] opacity-20"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Minimalist Botanical SVG instead of diamond */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-16 h-16 text-wedding-500 fill-none animate-bounce [animation-duration:3s]"
            >
              <path d="M50 85 C 50 85, 30 65, 30 40 C 30 25, 40 15, 50 15 C 60 15, 70 25, 70 40 C 70 65, 50 85, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M50 15 L50 85" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx="50" cy="40" r="4" fill="currentColor" className="animate-pulse" />
            </svg>
          </div>
        </div>

        {/* Brand Logo in Loading */}
        <div className="flex flex-col items-center mb-12">
            <Logo className="h-14 mb-2" />
        </div>

        {/* Elegant Progress Line */}
        <div className="w-48 h-px bg-gray-200 dark:bg-gray-800 relative overflow-hidden mb-6">
            <div className="absolute top-0 left-0 h-full bg-wedding-500 animate-[loadingLine_2s_infinite]"></div>
        </div>

        {/* Romantic Status Message */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.5em] font-medium text-wedding-900/50 dark:text-wedding-500/50 italic">
            Zerafetle Hazırlanıyor
          </span>
        </div>
      </div>

      <style>{`
        @keyframes loadingLine {
          0% { left: -100%; width: 30%; }
          50% { left: 0%; width: 100%; }
          100% { left: 100%; width: 30%; }
        }
      `}</style>
    </div>
  );
};
