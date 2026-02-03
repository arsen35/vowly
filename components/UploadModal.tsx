
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { generateWeddingCaption } from '../services/geminiService';
import { MediaItem } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl: string | null; location: string | null }) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
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
    if (selectedMedia.length === 0 || !caption || !userName.trim()) return;
    setIsProcessing(true);
    onUpload({
        media: selectedMedia,
        caption,
        hashtags,
        userName: userName.trim(),
        productUrl: productUrl.trim() || null,
        location: location.trim() || null
    });
    onClose();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-theme-dark rounded-t-3xl md:rounded-3xl w-full max-w-lg h-[90vh] md:h-auto overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-5">
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-theme-dark shrink-0">
          <h2 className="text-lg font-serif font-bold text-gray-800 dark:text-white">Anını Paylaş</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {selectedMedia.length > 0 ? (
                <div className="aspect-square w-full rounded-2xl overflow-hidden relative bg-black">
                    <img src={selectedMedia[currentPreviewIndex].url} alt="Preview" className="w-full h-full object-contain" />
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-wedding-50 dark:hover:bg-gray-800 transition-all">
                    <svg className="w-12 h-12 text-wedding-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-sm font-bold text-gray-500">Fotoğraf Seç</span>
                </div>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest block mb-2">İsim</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none" placeholder="Adınız Soyadınız" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest block mb-2">Konum / Şehir</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none" placeholder="Örn: İstanbul, Türkiye" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest block mb-2">Açıklama</label>
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none h-24 resize-none" placeholder="Neler hissediyorsun?" />
                </div>
            </div>
        </div>

        <div className="p-4 bg-white dark:bg-theme-dark border-t dark:border-gray-800 flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
            <Button onClick={handleSubmit} isLoading={isProcessing} className="flex-1">Paylaş</Button>
        </div>
      </div>
    </div>
  );
};
