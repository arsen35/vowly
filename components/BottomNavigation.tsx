
import React from 'react';
import { ViewState } from '../types';

interface BottomNavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onUploadClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onNavigate, onUploadClick }) => {
  const handleHomeClick = () => {
    if (currentView === ViewState.FEED) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate(ViewState.FEED);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[50] px-5 pb-8 pt-2 pointer-events-none">
      <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[12px] flex items-center justify-around h-16 pointer-events-auto max-w-sm mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        
        {/* AKIŞ (HOME) - Tıklanınca en üste çıkar */}
        <button 
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${currentView === ViewState.FEED ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg fill={currentView === ViewState.FEED ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[7px] font-bold mt-1 tracking-widest uppercase">AKIŞ</span>
        </button>

        {/* BLOG (DOCUMENT) */}
        <button 
          onClick={() => onNavigate(ViewState.BLOG)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${currentView === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg fill={currentView === ViewState.BLOG ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[7px] font-bold mt-1 tracking-widest uppercase">BLOG</span>
        </button>

        {/* "+" BUTTON - Yeni Şeffaf & Stroke Tasarımı */}
        <div className="flex-1 flex justify-center items-center">
            <button 
              onClick={onUploadClick}
              className="w-11 h-11 bg-white/10 dark:bg-white/5 text-wedding-500 rounded-[12px] flex items-center justify-center transform active:scale-90 transition-all border border-wedding-500/40 shadow-sm"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
        </div>

        {/* SOHBET (CHAT) */}
        <button 
          onClick={() => onNavigate(ViewState.CHAT)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${currentView === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg fill={currentView === ViewState.CHAT ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.197.388-1.609.208-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <span className="text-[7px] font-bold mt-1 tracking-widest uppercase">SOHBET</span>
        </button>

        {/* PROFİL (USER) */}
        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${currentView === ViewState.PROFILE ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg fill={currentView === ViewState.PROFILE ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[7px] font-bold mt-1 tracking-widest uppercase">PROFİL</span>
        </button>
      </div>
    </div>
  );
};
