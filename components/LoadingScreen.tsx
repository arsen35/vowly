
import React from 'react';
import { Logo } from './Logo';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f9f6f5] dark:bg-[#1a1614] transition-colors duration-500">
      {/* Dekoratif arka plan elementleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-wedding-100/40 dark:bg-wedding-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-wedding-200/40 dark:bg-wedding-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative flex flex-col items-center animate-fadeIn">
        {/* Marka Logosu - Merkezi Odak */}
        <div className="flex flex-col items-center mb-12 transform hover:scale-105 transition-transform duration-700">
            <div className="relative">
                {/* Logonun etrafında hafif bir ışıltı efekti */}
                <div className="absolute inset-0 bg-wedding-200/20 dark:bg-wedding-900/20 blur-2xl rounded-full animate-pulse"></div>
                <Logo className="h-20 md:h-24 mb-4 relative z-10" />
            </div>
        </div>

        {/* Zarif İlerleme Çizgisi */}
        <div className="w-48 h-px bg-gray-200 dark:bg-gray-800 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 h-full bg-wedding-500 animate-[loadingLine_2s_infinite]"></div>
        </div>

        {/* Durum Mesajı */}
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
