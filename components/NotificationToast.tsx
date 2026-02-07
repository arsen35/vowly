
import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';

interface NotificationToastProps {
  notification: AppNotification;
  onClose: (id: string) => void;
  onClick: (notif: AppNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, onClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after mount
    const t1 = setTimeout(() => setVisible(true), 100);
    // Hide after 6 seconds
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(notification.id), 500);
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [notification.id, onClose]);

  return (
    <div 
      onClick={() => onClick(notification)}
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-[3000] cursor-pointer transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
            <img src={notification.senderAvatar} className="w-10 h-10 rounded-xl object-cover border border-gray-50 dark:border-zinc-800" alt="sender" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] ${notification.type === 'dm' ? 'bg-blue-500' : 'bg-wedding-500'}`}>
                {notification.type === 'dm' ? (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                ) : (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" /></svg>
                )}
            </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold dark:text-white truncate pr-2">{notification.senderName}</span>
            <span className="text-[9px] text-gray-400 whitespace-nowrap">Şimdi</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">{notification.message}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(() => onClose(notification.id), 500); }}
          className="p-1 text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};
