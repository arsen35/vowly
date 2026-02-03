
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { generateWeddingCaption } from '../services/geminiService';
import { MediaItem } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl: string | null }) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [productUrl, setProductUrl] = useState('');

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newMediaItems: MediaItem[] = [];

      try {
        for (const file of files) {
           if (file.type.startsWith('image/')) {
               const base64Data = await processFile(file);
               newMediaItems.push({ 
                   url: base64Data,
                   type: 'image', 
                   mimeType: 'image/jpeg'
               });
           }
        }
  
        if (newMediaItems.length > 0) {
            setSelectedMedia(newMediaItems);
            setCurrentPreviewIndex(0);
            if (!caption) {
                const firstImageBase64 = newMediaItems[0].url.replace(/^data:image\/(png|jpeg|webp|jpg);base64,/, "");
                generateAICaption(firstImageBase64);
            }
        }
      } catch (err) {
          console.error("Dosya işleme hatası:", err);
          alert("Görsel işlenirken bir hata oluştu. Lütfen başka bir görsel deneyin.");
      }
    }
  };

  const generateAICaption = async (cleanBase64: string) => {
    setIsGeneratingAI(true);
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

  const handleSubmit = async () => {
    if (selectedMedia.length === 0 || !caption || !userName.trim()) return;
    
    setIsProcessing(true);

    onUpload({
        media: selectedMedia,
        caption,
        hashtags,
        userName: userName.trim(),
        productUrl: productUrl.trim() || null
    });
    
    onClose();
    setIsProcessing(false);
  };

  const nextPreview = () => {
      if (currentPreviewIndex < selectedMedia.length - 1) setCurrentPreviewIndex(currentPreviewIndex + 1);
  };
  const prevPreview = () => {
      if (currentPreviewIndex > 0) setCurrentPreviewIndex(currentPreviewIndex - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end md:items-center justify-center pt-12 md:pt-0 md:p-4 backdrop-blur-sm">
      <div className={`bg-white dark:bg-theme-dark rounded-t-2xl md:rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col
          ${selectedMedia.length > 0 ? 'md:max-w-5xl md:h-[90vh]' : 'max-w-lg md:h-auto'}
          h-full md:h-auto transition-all duration-300
      `}>
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-theme-dark shrink-0 h-14">
          <h2 className="text-lg font-serif font-bold text-gray-800 dark:text-white">Anını Paylaş</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-200 dark:bg-gray-700 dark:text-gray-300 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          {selectedMedia.length === 0 ? (
            <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center bg-gray-50 dark:bg-theme-dark">
                <div 
                  className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-wedding-500 hover:bg-wedding-50 dark:hover:bg-gray-700 transition-all group relative bg-white dark:bg-gray-800/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-wedding-50 dark:bg-wedding-900/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-wedding-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-bold text-lg">Fotoğraf Seç</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center px-4">En güzel anılarını paylaş.</p>
                </div>
            </div>
          ) : (
            <>
              <div className="w-full md:w-3/5 h-[40vh] md:h-full bg-black flex items-center justify-center relative group shrink-0">
                 <div className="w-full h-full flex items-center justify-center">
                    <img src={selectedMedia[currentPreviewIndex].url} alt="Preview" className="max-w-full max-h-full object-contain pointer-events-none select-none" />
                 </div>

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

                 {selectedMedia.length > 1 && (
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                         {selectedMedia.map((_, idx) => (
                             <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentPreviewIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                         ))}
                     </div>
                 )}
              </div>

              <div className="w-full md:w-2/5 bg-white dark:bg-theme-dark flex flex-col h-full overflow-hidden">
                 <div className="flex-1 overflow-y-auto p-5 pb-4">
                     <div className="space-y-5">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Görünecek İsim <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-wedding-500 focus:ring-1 focus:ring-wedding-500 transition-all"
                              placeholder="Adınız Soyadınız"
                            />
                         </div>

                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">Açıklama</label>
                                {isGeneratingAI && (
                                    <span className="flex items-center gap-1 text-xs text-wedding-500 font-medium animate-pulse">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10a1 1 0 11-2 0 1 1 0 012 0zm-5 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                        AI Yazıyor...
                                    </span>
                                )}
                            </div>
                            
                            <div className="bg-wedding-50 dark:bg-wedding-900/10 rounded-xl p-3 border border-wedding-100 dark:border-wedding-900/20">
                                <textarea
                                  className="w-full bg-transparent border-none p-0 text-sm text-gray-800 dark:text-gray-200 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[100px]"
                                  rows={4}
                                  placeholder="En güzel anını anlat..."
                                  value={caption}
                                  onChange={(e) => setCaption(e.target.value)}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                   {hashtags.map((tag, idx) => (
                                     <span key={idx} className="text-[10px] bg-white dark:bg-gray-800 text-wedding-600 dark:text-wedding-400 px-2 py-1 rounded-md font-medium border border-wedding-100 dark:border-gray-700">{tag}</span>
                                   ))}
                                </div>
                            </div>
                         </div>
                         
                         <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                             <div className="flex items-center gap-2 mb-3">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-wedding-500">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                 </svg>
                                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Ürün Bağlantısı (Opsiyonel)</label>
                             </div>
                             
                             <div className="space-y-3">
                                 <input 
                                   type="url" 
                                   value={productUrl}
                                   onChange={(e) => setProductUrl(e.target.value)}
                                   className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-wedding-500 focus:ring-1 focus:ring-wedding-500"
                                   placeholder="https://annabellabridal.com/urun..."
                                 />
                                 <p className="text-[10px] text-gray-400 dark:text-gray-500">Takipçiler bu linke tıklayarak ürünü satın alabilir.</p>
                             </div>
                         </div>
                         <div className="h-4 md:h-0"></div>
                     </div>
                 </div>

                 <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-theme-dark shrink-0 z-10 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <Button variant="secondary" onClick={onClose} className="!px-4">İptal</Button>
                    <Button onClick={handleSubmit} disabled={selectedMedia.length === 0 || isGeneratingAI || isProcessing || !userName.trim()} className="flex-1" isLoading={isProcessing}>
                        {isProcessing ? 'Paylaşılıyor...' : 'Paylaş'}
                    </Button>
                 </div>
              </div>
            </>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple
            className="hidden" 
          />
        </div>
      </div>
    </div>
  );
};
