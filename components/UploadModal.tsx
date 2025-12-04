import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { generateWeddingCaption } from '../services/geminiService';
import { MediaItem } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string }) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Touch state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Helper to compress image to WebP
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Web için optimize edilmiş boyutlar (Max 1000px yeterli)
                const MAX_WIDTH = 1000;
                const scaleSize = MAX_WIDTH / img.width;
                const width = Math.min(img.width, MAX_WIDTH);
                const height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // WebP formatı ve 0.65 kalite (İnanılmaz tasarruf sağlar)
                let compressedBase64 = canvas.toDataURL('image/webp', 0.65);
                
                // Eğer tarayıcı WebP desteklemiyorsa (çok eski cihazlar) JPEG'e dön
                if (!compressedBase64.startsWith('data:image/webp')) {
                    compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                }
                
                resolve(compressedBase64);
            };
        };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      const files: File[] = Array.from(e.target.files);
      const newMediaItems: MediaItem[] = [];

      try {
        for (const file of files) {
           const isVideo = file.type.startsWith('video/');
           let finalUrl = '';
           
           if (isVideo) {
               finalUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
               });
           } else {
               finalUrl = await compressImage(file);
           }
           
           newMediaItems.push({
               url: finalUrl,
               type: isVideo ? 'video' : 'image'
           });
        }
  
        setSelectedMedia(newMediaItems);
        setCurrentPreviewIndex(0);
  
        // AI Otomatik Caption
        if (newMediaItems.length > 0) {
          const firstMedia = newMediaItems[0];
          if (firstMedia.type === 'image') {
              generateAICaption(firstMedia.url);
          } else {
             setCaption("Bu özel anı ölümsüzleştirdik... 🎥✨");
             setHashtags(["#düğünvideosu", "#mutluanlar", "#vowly"]);
          }
        }
      } catch (err) {
          console.error("Dosya işleme hatası:", err);
          alert("Dosyalar yüklenirken bir hata oluştu.");
      } finally {
          setIsProcessing(false);
      }
    }
  };

  const generateAICaption = async (base64Image: string) => {
    setIsGeneratingAI(true);
    // data:image/webp;base64, kısmını temizle
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    
    try {
      const result = await generateWeddingCaption(cleanBase64);
      setCaption(result.caption);
      setHashtags(result.hashtags);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = () => {
    if (selectedMedia.length > 0 && caption && userName.trim()) {
      onUpload({
        media: selectedMedia,
        caption,
        hashtags,
        userName: userName.trim()
      });
      onClose();
    }
  };

  // ... (Navigasyon fonksiyonları aynı)
  const nextPreview = () => {
      if (currentPreviewIndex < selectedMedia.length - 1) {
          setCurrentPreviewIndex(currentPreviewIndex + 1);
      }
  };

  const prevPreview = () => {
      if (currentPreviewIndex > 0) {
          setCurrentPreviewIndex(currentPreviewIndex - 1);
      }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextPreview();
    if (distance < -minSwipeDistance) prevPreview();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm">
      {/* 
         LAYOUT YAPISI DEĞİŞTİ:
         1. h-[95vh] ile mobilde ekranın tepesinden azıcık boşluk bıraktık.
         2. rounded-t-2xl ile mobilde alttan açılan bir kart görünümü verdik.
         3. Flex-col yapısı ile Footer'ı (butonları) içerikten tamamen ayırdık.
      */}
      <div className={`bg-white rounded-t-2xl md:rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col
          ${selectedMedia.length > 0 ? 'md:max-w-5xl md:h-[85vh]' : 'max-w-lg md:h-auto'}
          h-[95vh] md:h-auto transition-all duration-300
      `}>
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0 h-14">
          <h2 className="text-lg font-serif font-bold text-gray-800">Anını Paylaş</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-200 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content Area - Scrollable but Footers are separated */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {selectedMedia.length === 0 ? (
            // EMPTY STATE
            <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center bg-gray-50">
                <div 
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-wedding-500 hover:bg-wedding-50 transition-all group relative bg-white"
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  {isProcessing ? (
                      <div className="flex flex-col items-center">
                          <svg className="animate-spin h-10 w-10 text-wedding-500 mb-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-gray-600 font-medium">Fotoğraflar Hazırlanıyor...</p>
                      </div>
                  ) : (
                      <>
                        <div className="bg-wedding-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-wedding-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-700 font-bold text-lg">Fotoğraf veya Video Seç</p>
                        <p className="text-gray-400 text-sm mt-2 text-center px-4">Anılarını bizimle paylaş.</p>
                      </>
                  )}
                </div>
            </div>
          ) : (
            <>
              {/* MEDIA PREVIEW SECTION */}
              {/* Mobile: Top (Fixed Height), Desktop: Left (Full Height) */}
              <div className="w-full md:w-3/5 h-[40vh] md:h-full bg-black flex items-center justify-center relative group shrink-0">
                 <div 
                    className="w-full h-full flex items-center justify-center touch-pan-y"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                 >
                    {selectedMedia[currentPreviewIndex].type === 'video' ? (
                      <video src={selectedMedia[currentPreviewIndex].url} controls className="max-w-full max-h-full object-contain" />
                    ) : (
                      <img src={selectedMedia[currentPreviewIndex].url} alt="Preview" className="max-w-full max-h-full object-contain pointer-events-none select-none" />
                    )}
                 </div>

                {/* Remove Button */}
                <button 
                  onClick={() => {
                      const newMedia = selectedMedia.filter((_, i) => i !== currentPreviewIndex);
                      setSelectedMedia(newMedia);
                      if (currentPreviewIndex >= newMedia.length) {
                          setCurrentPreviewIndex(Math.max(0, newMedia.length - 1));
                      }
                  }}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md transition-colors z-20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                 {/* Navigation Dots */}
                 {selectedMedia.length > 1 && (
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                         {selectedMedia.map((_, idx) => (
                             <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentPreviewIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                         ))}
                     </div>
                 )}
              </div>

              {/* FORM SECTION */}
              {/* Flex Column to separate Input Area (Scroll) from Buttons (Fixed) */}
              <div className="w-full md:w-2/5 bg-white flex flex-col h-full overflow-hidden">
                 
                 {/* Scrollable Input Area */}
                 <div className="flex-1 overflow-y-auto p-5 pb-4">
                     <div className="space-y-5">
                         {/* Name Input */}
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Görünecek İsim <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:border-wedding-500 focus:ring-1 focus:ring-wedding-500 transition-all"
                              placeholder="Adınız Soyadınız"
                            />
                         </div>

                         {/* Caption & AI */}
                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                  Açıklama
                                </label>
                                {isGeneratingAI && (
                                    <span className="flex items-center gap-1 text-xs text-wedding-500 font-medium animate-pulse">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10a1 1 0 11-2 0 1 1 0 012 0zm-5 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                        AI Yazıyor...
                                    </span>
                                )}
                            </div>
                            
                            <div className="bg-wedding-50 rounded-xl p-3 border border-wedding-100">
                                 {selectedMedia[0]?.type === 'image' && !caption && !isGeneratingAI && (
                                     <div className="mb-2 text-xs text-wedding-600 bg-white/60 p-2 rounded flex items-start gap-2">
                                         <p>✨ Gemini AI fotoğrafını inceliyor...</p>
                                     </div>
                                 )}
                                 
                                <textarea
                                  className="w-full bg-transparent border-none p-0 text-sm text-gray-800 focus:ring-0 placeholder-gray-400 resize-none min-h-[100px]"
                                  rows={4}
                                  placeholder="En güzel anını anlat..."
                                  value={caption}
                                  onChange={(e) => setCaption(e.target.value)}
                                />
                                
                                <div className="mt-2 flex flex-wrap gap-2">
                                   {hashtags.map((tag, idx) => (
                                     <span key={idx} className="text-[10px] bg-white text-wedding-600 px-2 py-1 rounded-md font-medium border border-wedding-100">
                                         {tag}
                                     </span>
                                   ))}
                                </div>
                            </div>
                         </div>
                         
                         {/* Spacer for mobile to ensure last input is visible above keyboard if needed */}
                         <div className="h-4 md:h-0"></div>
                     </div>
                 </div>

                 {/* FIXED FOOTER AREA - This is now outside the scroll view */}
                 <div className="p-4 border-t bg-white shrink-0 z-10 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <Button variant="secondary" onClick={onClose} className="!px-4">İptal</Button>
                    <Button onClick={handleSubmit} disabled={selectedMedia.length === 0 || isGeneratingAI || isProcessing || !userName.trim()} className="flex-1">
                        {isProcessing ? 'Sıkıştırılıyor...' : 'Paylaş'}
                    </Button>
                 </div>

              </div>
            </>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            multiple
            className="hidden" 
          />
        </div>
      </div>
    </div>
  );
};