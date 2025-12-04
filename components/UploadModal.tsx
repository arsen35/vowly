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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Touch state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newMediaItems: MediaItem[] = [];

      // Dosyaları oku
      for (const file of files) {
         const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
         });
         
         const isVideo = file.type.startsWith('video/');
         newMediaItems.push({
             url: base64,
             type: isVideo ? 'video' : 'image'
         });
      }

      setSelectedMedia(newMediaItems);
      setCurrentPreviewIndex(0);

      // AI sadece ilk fotoğraf için çalışsın
      if (newMediaItems.length > 0) {
        const firstMedia = newMediaItems[0];
        if (firstMedia.type === 'image') {
            generateAICaption(firstMedia.url);
        } else {
           setCaption("Bu özel anı ölümsüzleştirdik... 🎥✨");
           setHashtags(["#düğünvideosu", "#mutluanlar", "#vowly"]);
        }
      }
    }
  };

  const generateAICaption = async (base64Image: string) => {
    setIsGeneratingAI(true);
    const cleanBase64 = base64Image.split(',')[1];
    
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

  // Touch Handlers
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextPreview();
    }
    if (isRightSwipe) {
      prevPreview();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* 
         Responsive Container:
         Mobile: max-w-lg, height auto (max 90vh)
         Desktop (md): max-w-4xl, fixed height (80vh) for split view
      */}
      <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col
          ${selectedMedia.length > 0 ? 'md:max-w-5xl md:h-[85vh]' : 'max-w-lg'}
          max-h-[90vh] transition-all duration-300
      `}>
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-xl font-serif font-bold text-gray-800">Anını Paylaş</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className={`flex-1 overflow-hidden flex flex-col ${selectedMedia.length > 0 ? 'md:flex-row' : ''}`}>
          
          {selectedMedia.length === 0 ? (
            // Empty State (Upload Prompt)
            <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center">
                <div 
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-wedding-500 hover:bg-wedding-50 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-wedding-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-wedding-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                  </div>
                  <p className="text-gray-700 font-bold text-lg">Fotoğraf veya Video Seç</p>
                  <p className="text-gray-400 text-sm mt-2 text-center px-4">Sürükle bırak veya galeriden seç.<br/>En mutlu anlarını paylaş.</p>
                </div>
            </div>
          ) : (
            <>
              {/* Left Side (Desktop): Media Preview */}
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative group md:h-full shrink-0 aspect-[4/5] md:aspect-auto">
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
                  title="Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                 {/* Desktop Nav Buttons */}
                 {selectedMedia.length > 1 && (
                     <>
                        <button onClick={prevPreview} className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all ${currentPreviewIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={nextPreview} className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all ${currentPreviewIndex === selectedMedia.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                        
                        {/* Pagination Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {selectedMedia.map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentPreviewIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                            ))}
                        </div>
                     </>
                 )}
              </div>

              {/* Right Side (Desktop) / Bottom (Mobile): Form */}
              <div className="w-full md:w-2/5 p-6 overflow-y-auto bg-white flex flex-col">
                 <div className="flex-1 space-y-5">
                     
                     {/* Name Input */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Görünecek İsim <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input 
                              type="text" 
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 p-3 text-sm text-gray-800 focus:outline-none focus:border-wedding-500 focus:ring-1 focus:ring-wedding-500 transition-all"
                              placeholder="Adınız Soyadınız"
                            />
                        </div>
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
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
                                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 11.03a.75.75 0 111.06-1.06l.75.75a.75.75 0 01-1.06 1.06l-.75-.75z" clipRule="evenodd" />
                                     </svg>
                                     <p>Gemini AI fotoğrafını analiz etti ve senin için bir açıklama taslağı oluşturdu. Düzenleyebilirsin!</p>
                                 </div>
                             )}
                             
                            <textarea
                              className="w-full bg-transparent border-none p-0 text-sm text-gray-800 focus:ring-0 placeholder-gray-400 resize-none"
                              rows={5}
                              placeholder="En güzel anını anlat..."
                              value={caption}
                              onChange={(e) => setCaption(e.target.value)}
                            />
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                               {hashtags.map((tag, idx) => (
                                 <span key={idx} className="text-xs bg-white text-wedding-600 px-2 py-1 rounded-md font-medium shadow-sm border border-wedding-100">
                                     {tag}
                                 </span>
                               ))}
                            </div>
                        </div>
                     </div>
                 </div>

                 {/* Mobile Footer (Inside form) / Desktop Footer */}
                 <div className="mt-6 pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                    <Button variant="secondary" onClick={onClose} className="!px-4">İptal</Button>
                    <Button onClick={handleSubmit} disabled={selectedMedia.length === 0 || isGeneratingAI || !userName.trim()} className="flex-1 md:flex-none">
                        Paylaş
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