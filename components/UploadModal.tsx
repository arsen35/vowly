
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { generateWeddingCaption } from '../services/geminiService';
import { MediaItem, User } from '../types';

interface UploadModalProps {
  user: User | null;
  onClose: () => void;
  onUpload: (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl: string | null; location: string | null }) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ user, onClose, onUpload }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState('');
  const [location, setLocation] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newMediaItems: MediaItem[] = [];
      for (const file of files) {
          const reader = new FileReader();
          const base64: string = await new Promise((resolve) => {
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
          });
          // URL'i Base64 tutuyoruz (önizleme için), file objesini saklıyoruz (yükleme için)
          newMediaItems.push({ url: base64, type: 'image', file });
      }
      setSelectedMedia(newMediaItems);
      const cleanBase64 = newMediaItems[0].url.replace(/^data:image\/(png|jpeg|webp|jpg);base64,/, "");
      generateAICaption(cleanBase64);
    }
  };

  const generateAICaption = async (cleanBase64: string) => {
    setIsGeneratingAI(true);
    try {
      const result = await generateWeddingCaption(cleanBase64);
      setCaption(result.caption);
      setHashtags(result.hashtags);
    } catch (err) {}
    finally { setIsGeneratingAI(false); }
  };

  const handleSubmit = async () => {
    if (selectedMedia.length === 0 || !caption || !user) return;
    setIsProcessing(true);
    // Verileri gönder
    onUpload({ 
        media: selectedMedia, 
        caption, 
        hashtags, 
        userName: user.name, 
        productUrl: productUrl.trim() || null, 
        location: location.trim() || null 
    });
    // App.tsx tarafında setViewState(FEED) zaten yapılıyor, modalı burada bekletmiyoruz.
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-zinc-950 rounded-t-lg md:rounded-lg w-full max-w-xl h-[90vh] md:h-auto overflow-hidden flex flex-col shadow-2xl">
        <div className="p-5 border-b dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-zinc-950">
          <div>
            <h2 className="text-lg font-serif font-bold dark:text-white uppercase tracking-widest">Post Paylaş</h2>
            <p className="text-[9px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">En güzel anlarını toplulukla buluştur</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-2"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {!selectedMedia.length ? (
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-wedding-50 transition-all">
                    <svg className="w-10 h-10 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fotoğraf Seç</span>
                </div>
            ) : (
                <div className="aspect-square w-full rounded-lg overflow-hidden relative shadow-inner">
                    <img src={selectedMedia[0].url} className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedMedia([])} className="absolute top-4 right-4 bg-black/50 text-white text-[10px] font-bold px-3 py-1.5 rounded-md backdrop-blur-sm">Değiştir</button>
                    {isGeneratingAI && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-white text-[9px] font-bold uppercase tracking-widest">AI Başlık Yazıyor...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg">
                        <label className="text-[9px] font-bold text-wedding-500 uppercase tracking-widest block mb-1">Konum</label>
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Şehir, Ülke" />
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg">
                        <label className="text-[9px] font-bold text-wedding-500 uppercase tracking-widest block mb-1">Ürün Linki</label>
                        <input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Shopify Linki" />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg">
                    <label className="text-[9px] font-bold text-wedding-500 uppercase tracking-widest block mb-2">Açıklama</label>
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-transparent text-sm outline-none h-24 dark:text-white resize-none font-serif italic" placeholder="Bu anı anlat..." />
                    <div className="mt-3 flex flex-wrap gap-1">
                        {hashtags.map((tag, i) => (
                            <span key={i} className="text-[9px] font-bold text-wedding-500 bg-wedding-100 dark:bg-wedding-900/30 px-2 py-0.5 rounded-md">#{tag.replace('#', '')}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-950 border-t flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-zinc-900 rounded-md">Vazgeç</button>
            <Button onClick={handleSubmit} isLoading={isProcessing} disabled={isGeneratingAI} className="flex-[2] py-3 rounded-md text-[10px] uppercase tracking-widest">Paylaş</Button>
        </div>
      </div>
    </div>
  );
};
