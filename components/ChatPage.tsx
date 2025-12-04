
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { ChatMessage } from '../types';
import { Button } from './Button';

interface ChatPageProps {
  isAdmin: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isAdmin }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load User from LocalStorage or Admin
  useEffect(() => {
    if (isAdmin) {
        setUserId('admin-user');
        setUserName('Annabella Yetkili');
        setIsNameSet(true);
        return;
    }

    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
        const { id, name } = JSON.parse(storedUser);
        setUserId(id);
        setUserName(name);
        setIsNameSet(true);
    }
  }, [isAdmin]);

  // Subscribe to Realtime Updates
  useEffect(() => {
    if (!isNameSet) return;

    const unsubscribe = dbService.subscribeToChat((msgs) => {
        setMessages(msgs);
    });

    return () => unsubscribe();
  }, [isNameSet]);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isNameSet, selectedImage]); // Resim seçince de scroll et

  // AGRESİF SIKIŞTIRMA FONKSİYONU (Max 600px width, Düşük Kalite)
  const compressImageForChat = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; // Sohbet için küçük boyut yeterli
                const scaleSize = MAX_WIDTH / img.width;
                const width = Math.min(img.width, MAX_WIDTH);
                const height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // WebP formatı ve 0.7 kalite ile sıkıştır
                resolve(canvas.toDataURL('image/webp', 0.7));
            };
        };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (!file.type.startsWith('image/')) return;

          try {
            const compressedBase64 = await compressImageForChat(file);
            setSelectedImage(compressedBase64);
          } catch (err) {
            console.error("Resim işlenemedi", err);
            alert("Resim yüklenirken bir hata oluştu.");
          }
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const newId = `user-${Date.now()}`;
    const user = { id: newId, name: userName };
    localStorage.setItem('chat_user', JSON.stringify(user));
    
    setUserId(newId);
    setIsNameSet(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || isSending) return;

    setIsSending(true);
    const textToSend = newMessage;
    const imageToSend = selectedImage;

    // UI'ı hemen temizle
    setNewMessage(''); 
    setSelectedImage(null);

    try {
        await dbService.sendChatMessage({
            text: textToSend,
            image: imageToSend || undefined,
            userId: userId,
            userName: userName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${isAdmin ? '881337' : 'random'}&color=${isAdmin ? 'fff' : 'fff'}`,
            timestamp: Date.now(),
            isAdmin: isAdmin
        });
    } catch (error) {
        console.error("Mesaj gönderilemedi", error);
        // Hata olursa geri yükle (basitçe)
        alert("Mesaj gönderilemedi.");
        setNewMessage(textToSend);
        setSelectedImage(imageToSend);
    } finally {
        setIsSending(false);
    }
  };

  // Özel Wedding Texture (SVG Pattern)
  const weddingPattern = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23881337' stroke-width='0.8' fill='none' fill-rule='evenodd' opacity='0.07'%3E%3Cpath d='M10 10 C 10 5, 15 5, 17 8 C 19 5, 24 5, 24 10 C 24 15, 17 20, 17 20 C 17 20, 10 15, 10 10' /%3E%3Ccircle cx='50' cy='50' r='8' /%3E%3Cpath d='M50 42 L53 38 L47 38 Z' /%3E%3Cpath d='M80 80 C 75 75, 70 80, 75 85 C 70 90, 75 95, 80 90 C 85 95, 90 90, 85 85 C 90 80, 85 75, 80 80' /%3E%3Cpath d='M20 80 L20 90 M15 85 L25 85' /%3E%3Cpath d='M80 15 L80 25 L85 25 L85 15 Z' /%3E%3C/g%3E%3C/svg%3E`;

  // 1. GİRİŞ EKRANI
  if (!isNameSet) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 animate-fadeIn bg-[#fff5f7]" style={{ backgroundImage: `url("${weddingPattern}")` }}>
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-wedding-100">
                <div className="w-16 h-16 bg-wedding-100 rounded-full flex items-center justify-center mx-auto mb-4 text-wedding-600 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.197.388-1.609.208-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Gelinler Topluluğu</h2>
                <p className="text-gray-500 mb-6 text-sm">Diğer gelin adaylarıyla tanışmak, fikir alışverişi yapmak ve sorularını sormak için sohbete katıl.</p>
                
                <form onSubmit={handleJoinChat}>
                    <input 
                        type="text" 
                        placeholder="Adın nedir?" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-wedding-500 outline-none"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full" disabled={!userName.trim()}>Sohbete Katıl</Button>
                </form>
            </div>
        </div>
    );
  }

  // 2. SOHBET EKRANI
  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] bg-[#fff5f7] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-80" 
             style={{ 
                 backgroundImage: `url("${weddingPattern}")`,
                 backgroundSize: '150px 150px' 
             }}>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar">
            <div className="flex flex-col justify-end min-h-full space-y-2 pb-2">
                
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-60 self-center mb-auto mt-20">
                        <div className="bg-[#fff3cd] border border-[#ffeeba] text-[#856404] px-4 py-2 rounded-lg inline-block shadow-sm text-sm">
                            🔒 Mesajlar uçtan uca şifrelenmese de kalpten kalbe şifrelidir. ❤️
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.userId === userId;
                    const isPrevSame = index > 0 && messages[index - 1].userId === msg.userId;

                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 shrink-0 ${isPrevSame ? 'opacity-0 h-0' : ''}`}>
                                    <img src={msg.avatar} className="w-8 h-8 rounded-full border border-black/5 shadow-sm bg-white" alt="avatar" />
                                </div>

                                {/* Bubble */}
                                <div className={`
                                    p-1.5 shadow-sm relative break-words text-sm
                                    ${isMe 
                                        ? 'bg-[#e7ffdb] text-gray-900 rounded-l-lg rounded-br-lg' 
                                        : msg.isAdmin 
                                            ? 'bg-wedding-50 border border-wedding-200 text-gray-900 rounded-r-lg rounded-bl-lg'
                                            : 'bg-white text-gray-900 rounded-r-lg rounded-bl-lg'
                                    }
                                    ${isPrevSame ? (isMe ? 'rounded-tr-lg mt-0.5' : 'rounded-tl-lg mt-0.5') : 'rounded-t-lg mt-2'}
                                `}>
                                    {!isMe && !isPrevSame && (
                                        <p className={`text-[11px] font-bold mb-1 mx-1.5 ${msg.isAdmin ? 'text-wedding-600 flex items-center gap-1' : 'text-orange-600'}`}>
                                            {msg.userName}
                                            {msg.isAdmin && (
                                                <span className="bg-wedding-600 text-white text-[9px] px-1 rounded-[3px] uppercase tracking-wider">Yönetici</span>
                                            )}
                                        </p>
                                    )}
                                    
                                    {/* IMAGE RENDER */}
                                    {msg.image && (
                                        <div className="mb-1 rounded-lg overflow-hidden border border-black/5">
                                            <img src={msg.image} alt="Chat media" className="max-w-full h-auto max-h-60 object-cover" />
                                        </div>
                                    )}
                                    
                                    {/* TEXT RENDER */}
                                    {msg.text && (
                                        <p className="whitespace-pre-wrap leading-snug mx-1.5 mb-0.5">{msg.text}</p>
                                    )}

                                    <span className={`text-[10px] block text-right mt-0.5 mx-1.5 ${isMe ? 'text-green-800/60' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <span className="ml-1 text-blue-400">✓✓</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Input Area */}
        <div className="bg-[#f0f2f5] px-2 py-2 border-t border-gray-200 z-20 flex flex-col gap-2">
            
            {/* Image Preview (If selected) */}
            {selectedImage && (
                <div className="mx-4 mb-1 relative bg-white p-2 rounded-xl shadow-md border border-wedding-100 self-start animate-in slide-in-from-bottom-5">
                    <img src={selectedImage} alt="Preview" className="h-24 w-auto rounded-lg object-cover" />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                />
                
                {/* Plus/Attach Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-500 p-3 mb-1 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm active:scale-95 border border-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>

                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 items-end">
                    <textarea 
                        className="flex-1 bg-white border-0 rounded-2xl px-4 py-3 text-sm focus:ring-0 focus:outline-none placeholder-gray-500 shadow-sm resize-none min-h-[44px] max-h-[120px]"
                        placeholder="Bir mesaj yazın..."
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        style={{ height: 'auto', overflowY: newMessage.length > 50 ? 'auto' : 'hidden' }}
                    />
                    <button 
                        type="submit" 
                        disabled={(!newMessage.trim() && !selectedImage) || isSending}
                        className={`
                            p-3 mb-1 rounded-full transition-all duration-200 flex items-center justify-center shadow-md flex-shrink-0
                            ${(newMessage.trim() || selectedImage) && !isSending
                                ? 'bg-wedding-500 hover:bg-wedding-600 text-white transform active:scale-95' 
                                : 'bg-transparent text-gray-400 shadow-none cursor-default'
                            }
                        `}
                    >
                        {isSending ? (
                             <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};
