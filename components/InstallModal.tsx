
import React from 'react';
import { Button } from './Button';

interface InstallModalProps {
  onClose: () => void;
  onInstall: () => void;
  platform: 'ios' | 'android' | 'desktop';
  canTriggerNative: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({ onClose, onInstall, platform, canTriggerNative }) => {
  const isIOS = platform === 'ios';
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isInstagram = userAgent.includes('instagram') || userAgent.includes('fbav'); // Instagram veya FB tarayıcısı mı?

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 rounded-[5px] w-full max-w-[320px] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-900 relative">
        
        {/* Kapatma */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white z-10 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8 flex flex-col items-center text-center">
            {/* Gerçek Logo */}
            <img 
                src="https://cdn.shopify.com/s/files/1/0733/2285/6611/files/FAV-CENTER-LOGO-1.png?v=1770124550" 
                className="w-24 h-auto mb-8 animate-in zoom-in-50 duration-500" 
                alt="Logo"
            />

            <h2 className="text-xl font-bold dark:text-white uppercase tracking-[0.1em] mb-4 leading-tight">UYGULAMAYI YÜKLE</h2>
            
            {isInstagram ? (
              // INSTAGRAM İÇİNDEYSE (Android/iOS Farketmez)
              <div className="w-full bg-red-50 dark:bg-red-900/10 p-4 rounded-[5px] border border-red-100 dark:border-red-900/20">
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-relaxed">
                    Instagram üzerinden yükleme yapılamaz. <br/> 
                    Lütfen sağ üstteki <span className="font-bold">üç noktaya</span> tıklayıp <br/>
                    <span className="font-bold underline">"Tarayıcıda Aç"</span> deyin.
                  </p>
              </div>
            ) : isIOS ? (
              // SAFARI (IPHONE) İÇİNDEYSE
              <div className="w-full bg-wedding-50 dark:bg-zinc-900 p-5 rounded-[5px] border border-wedding-100 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                  <div className="flex flex-col items-center gap-4">
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-snug">
                          iPhone'a yüklemek için alttaki <span className="text-wedding-500 font-bold">Paylaş</span> ikonuna basın ve <span className="font-bold underline">"Ana Ekrana Ekle"</span> seçeneğini seçin.
                      </p>
                      <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-black rounded-[5px] shadow-sm animate-bounce text-blue-500">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                          </svg>
                      </div>
                  </div>
              </div>
            ) : (
              // NORMAL TARAYICI (ANDROID/DESKTOP)
              <>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-10 leading-relaxed">
                  Daha hızlı ve tam ekran <br/> bir deneyim için ana ekranına ekle.
                </p>
                <Button 
                    onClick={onInstall} 
                    className="w-full py-4 rounded-[5px] text-[11px] uppercase tracking-[0.3em] font-bold shadow-lg shadow-wedding-500/20"
                >
                    ŞİMDİ YÜKLE
                </Button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};
