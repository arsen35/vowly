
import React from 'react';
import { ViewState } from '../types';

interface BottomNavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onUploadClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onNavigate, onUploadClick }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[50] px-6 pb-6 pt-2 pointer-events-none">
      <div className="bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[10px] flex items-center justify-around h-14 pointer-events-auto relative overflow-visible max-w-sm mx-auto">
        
        {/* AKIŞ */}
        <button 
          onClick={() => onNavigate(ViewState.FEED)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentView === ViewState.FEED ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === ViewState.FEED ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5 tracking-tighter">AKIŞ</span>
        </button>

        {/* BLOG */}
        <button 
          onClick={() => onNavigate(ViewState.BLOG)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentView === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === ViewState.BLOG ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5 tracking-tighter">BLOG</span>
        </button>

        {/* MERKEZİ "+" BUTONU */}
        <div className="flex-1 flex justify-center items-center">
            <button 
              onClick={onUploadClick}
              className="w-11 h-11 bg-white dark:bg-gray-900 text-wedding-500 rounded-[8px] border border-wedding-200 dark:border-wedding-900 flex items-center justify-center transform active:scale-90 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
        </div>

        {/* SOHBET */}
        <button 
          onClick={() => onNavigate(ViewState.CHAT)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentView === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === ViewState.CHAT ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-6.75 4.125a3 3 0 003 3h10.5a3 3 0 003-3v-10.5a3 3 0 00-3-3H3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h3l-3 3z" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5 tracking-tighter uppercase">SOHBET</span>
        </button>

        {/* PROFİL (Eski Mağaza yerine) */}
        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentView === ViewState.PROFILE ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === ViewState.PROFILE ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5 tracking-tighter uppercase">PROFİL</span>
        </button>
      </div>
    </div>
  );
};
