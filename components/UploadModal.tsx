
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
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
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
          newMediaItems.push({ url: base64, type: 'image' });
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
    } catch (err) { console.error(err); }
    finally { setIsGeneratingAI(false); }
  };

  const handleSubmit = async () => {
    if (selectedMedia.length === 0 || !caption || !user) return;
    setIsProcessing(true);
    onUpload({
        media: selectedMedia,
        caption,
        hashtags,
        userName: user.name,
        productUrl: productUrl.trim() || null,
        location: location.trim() || null
    });
    onClose();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-xl h-[92vh] md:h-auto overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 border-t border-gray-100 dark:border-zinc-900">
        <div className="p-6 border-b dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-zinc-950 shrink-0">
          <div>
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white uppercase tracking-widest">Anını Ölümsüzleştir</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 tracking-widest font-bold">MUTLU ANLARINI TOPLULUKLA PAYLAŞ</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-all p-2 bg-gray-100 dark:bg-zinc-900 rounded-2xl active:scale-90">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {selectedMedia.length > 0 ? (
                <div className="aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden relative bg-black shadow-2xl">
                    <img src={selectedMedia[currentPreviewIndex].url} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedMedia([])} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-xl backdrop-blur-md">Değiştir</button>
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="aspect-[4/5] border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:bg-wedding-50 dark:hover:bg-wedding-900/10 hover:border-wedding-500/50 transition-all group">
                    <div className="w-20 h-20 bg-wedding-50 dark:bg-wedding-900/10 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-wedding-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fotoğrafını Sürükle veya Seç</span>
                    <span className="text-[10px] text-gray-300 mt-2 italic font-serif">En güzel anın burada başlasın ✨</span>
                </div>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest block mb-2">Konum Bilgisi</label>
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent pl-6 py-1 text-sm dark:text-white outline-none font-medium" placeholder="İstanbul, Türkiye" />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest block mb-2">Ürün Linki</label>
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                            <input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} className="w-full bg-transparent pl-6 py-1 text-sm dark:text-white outline-none font-medium" placeholder="shopify.com/ürün-linki" />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-900 p-5 rounded-[2rem] border border-gray-100 dark:border-zinc-800">
                    <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest block mb-3">Paylaşım Açıklaması</label>
                    <div className="relative">
                        {isGeneratingAI && <div className="absolute top-0 right-0 animate-pulse text-[9px] text-wedding-500 font-bold">AI YAZIYOR...</div>}
                        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-transparent text-sm dark:text-white outline-none h-32 resize-none font-serif leading-relaxed italic" placeholder="Bu özel anı birkaç kelimeyle anlat..." />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {hashtags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold text-wedding-500 bg-wedding-100 dark:bg-wedding-900/30 px-3 py-1 rounded-xl">#{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-950 border-t dark:border-zinc-900 flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-zinc-900 rounded-3xl hover:bg-gray-100 transition-all">Vazgeç</button>
            <Button onClick={handleSubmit} isLoading={isProcessing} className="flex-[2] py-4 rounded-3xl shadow-xl text-xs uppercase tracking-[0.2em]">Hemen Paylaş</Button>
        </div>
      </div>
    </div>
  );
};
