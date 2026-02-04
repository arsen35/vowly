
import React, { useState } from 'react';
import { Button } from './Button';

interface InstallModalProps {
  onClose: () => void;
  onInstall: () => void;
  platform: 'ios' | 'android' | 'desktop';
  canTriggerNative: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({ onClose, onInstall, platform, canTriggerNative }) => {
  const isIOS = platform === 'ios';
  const [showIOSHint, setShowIOSHint] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 rounded-[5px] w-full max-w-[320px] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-900 relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white z-10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8 flex flex-col items-center text-center">
            {/* App Icon */}
            <div className="w-20 h-20 bg-wedding-500 rounded-[5px] flex items-center justify-center mb-6 shadow-lg shadow-wedding-500/20">
                <img 
                    src="https://cdn.shopify.com/s/files/1/0733/2285/6611/files/FAV-CENTER-LOGO-1.png?v=1770124550" 
                    className="w-12 h-12 brightness-0 invert" 
                    alt="Logo"
                />
            </div>

            <h2 className="text-lg font-serif font-bold dark:text-white uppercase tracking-widest mb-2">Annabella'yı Yükle</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-8">Daha hızlı ve tam ekran deneyimi</p>

            {!showIOSHint ? (
                <Button 
                    onClick={() => isIOS ? setShowIOSHint(true) : onInstall()} 
                    className="w-full py-4 rounded-[5px] text-[10px] uppercase tracking-[0.3em] font-bold"
                >
                    Şimdi Yükle
                </Button>
            ) : (
                <div className="w-full animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gray-50 dark:bg-zinc-900 rounded-[5px] p-4 border border-gray-100 dark:border-zinc-800">
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                                Safari'de aşağıdaki <span className="text-wedding-500 font-bold">Paylaş</span> simgesine tıklayıp <span className="font-bold">"Ana Ekrana Ekle"</span> demeniz yeterli.
                            </p>
                            <div className="flex items-center justify-center p-3 bg-white dark:bg-black rounded-[5px] shadow-sm animate-bounce">
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
