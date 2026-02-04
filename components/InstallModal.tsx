
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

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 rounded-[5px] w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-900">
        
        {/* Header - 5px radius harmony */}
        <div className="bg-wedding-500 p-8 text-center text-white relative">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[5px] mx-auto mb-4 flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
            </div>
            <h2 className="text-xl font-serif font-bold tracking-tight uppercase">Uygulamayı Yükle</h2>
            <p className="text-wedding-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Daha hızlı erişim ve tam ekran deneyimi için</p>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-white dark:bg-zinc-950">
            {isIOS ? (
                <div className="space-y-4">
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium text-center mb-6 leading-relaxed">
                        Annabella'yı iPhone cihazına yüklemek için şu adımları izle:
                    </p>
                    
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-[5px] border border-gray-100 dark:border-zinc-800 transition-all">
                        <div className="bg-wedding-500 text-white w-6 h-6 rounded-[5px] flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                        <div className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                            Tarayıcının altındaki <span className="font-bold text-wedding-500">Paylaş (Kutu ve ok)</span> simgesine tıkla.
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-[5px] border border-gray-100 dark:border-zinc-800 transition-all">
                        <div className="bg-wedding-500 text-white w-6 h-6 rounded-[5px] flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                        <div className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                            Listeyi kaydır ve <span className="font-bold">Ana Ekrana Ekle</span> seçeneğini seç.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6">
                     <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium leading-relaxed mb-6">
                        {canTriggerNative 
                            ? "Uygulamayı ana ekranına hemen ekleyerek dilediğin zaman hızlıca erişebilirsin." 
                            : "Tarayıcı ayarlarından 'Uygulamayı Yükle' seçeneğini kullanarak uygulamayı hemen indirebilirsin."}
                     </p>
                     {canTriggerNative && (
                         <Button onClick={onInstall} className="w-full py-4 rounded-[5px] text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-wedding-500/20">
                             Hemen Yükle
                         </Button>
                     )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-zinc-900/30 border-t border-gray-100 dark:border-zinc-900 flex gap-3">
            <button 
                onClick={onClose} 
                className="flex-1 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-wedding-500 transition-colors"
            >
                Kapat
            </button>
        </div>
      </div>
    </div>
  );
};
