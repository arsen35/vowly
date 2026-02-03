
import React from 'react';
import { ViewState } from '../types';

interface BottomNavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onUploadClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onNavigate, onUploadClick }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[50] px-4 pb-6 pt-2 pointer-events-none">
      <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-around h-16 pointer-events-auto relative overflow-visible">
        
        {/* AKIŞ */}
        <button 
          onClick={() => onNavigate(ViewState.FEED)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentView === ViewState.FEED ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === ViewState.FEED ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[9px] font-bold mt-1 tracking-tighter">AKIŞ</span>
        </button>

        {/* BLOG */}
        <button 
          onClick={() => onNavigate(ViewState.BLOG)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentView === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === ViewState.BLOG ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
          <span className="text-[9px] font-bold mt-1 tracking-tighter">BLOG</span>
        </button>

        {/* MERKEZİ "+" BUTONU */}
        <div className="flex-1 flex justify-center -mt-12">
            <button 
              onClick={onUploadClick}
              className="w-14 h-14 bg-gradient-to-br from-wedding-500 to-wedding-600 text-white rounded-full shadow-[0_8px_20px_rgba(166,109,96,0.4)] flex items-center justify-center transform active:scale-90 transition-all border-4 border-white dark:border-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
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
          <span className="text-[9px] font-bold mt-1 tracking-tighter uppercase">SOHBET</span>
        </button>

        {/* MAĞAZA */}
        <a 
          href="https://www.annabellabridal.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 dark:text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0L3.04 4.354a.75.75 0 01.688-.354h16.544a.75.75 0 01.688.354l.263 1.116" />
          </svg>
          <span className="text-[9px] font-bold mt-1 tracking-tighter uppercase">MAĞAZA</span>
        </a>
      </div>
    </div>
  );
};
