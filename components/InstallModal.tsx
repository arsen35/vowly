
import React from 'react';
import { Button } from './Button';

interface InstallModalProps {
  onClose: () => void;
  onInstall: () => void;
  platform: 'ios' | 'android' | 'desktop';
  canTriggerNative: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({ onClose, onInstall, platform, canTriggerNative }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-wedding-500 p-6 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center text-wedding-500 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
            </div>
            <h2 className="text-xl font-serif font-bold relative z-10">Uygulamayı Yükle</h2>
            <p className="text-wedding-100 text-sm mt-1 relative z-10">Daha iyi bir deneyim için ana ekranına ekle.</p>
        </div>

        {/* Content */}
        <div className="p-6">
            {platform === 'ios' ? (
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm text-center mb-4">iPhone cihazına yüklemek için aşağıdaki adımları izle:</p>
                    
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        <div className="text-sm text-gray-700">Tarayıcının altındaki <span className="font-bold text-blue-500">Paylaş</span> butonuna bas.</div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        <div className="text-sm text-gray-700">Açılan menüde <span className="font-bold">Ana Ekrana Ekle</span> seçeneğini bul ve bas.</div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-4">
                     <p className="text-gray-600 text-sm">
                        {canTriggerNative 
                            ? "Uygulamayı hemen telefonuna indirebilirsin." 
                            : "Tarayıcı menüsünden 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğini kullanarak yükleyebilirsin."}
                     </p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Kapat</Button>
            {platform !== 'ios' && canTriggerNative && (
                <Button onClick={onInstall} className="flex-1">Yükle</Button>
            )}
        </div>
      </div>
    </div>
  );
};
