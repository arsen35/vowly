
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
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isNameSet, setIsNameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages, isNameSet]);

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
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage(''); // Optimistic clear

    try {
        await dbService.sendChatMessage({
            text: textToSend,
            userId: userId,
            userName: userName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${isAdmin ? '881337' : 'random'}&color=${isAdmin ? 'fff' : 'fff'}`,
            timestamp: Date.now(),
            isAdmin: isAdmin
        });
    } catch (error) {
        console.error("Mesaj gönderilemedi", error);
        setNewMessage(textToSend); // Revert on fail
    }
  };

  // Özel Wedding Texture (SVG Pattern) - Stroke Style like WhatsApp
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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#fff5f7] relative">
        {/* Background Pattern - Fixed */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-80" 
             style={{ 
                 backgroundImage: `url("${weddingPattern}")`,
                 backgroundSize: '150px 150px' // İkonların boyutu
             }}>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar">
            {/* 'min-h-full' ve 'justify-end' sayesinde mesajlar az olsa bile en altta durur */}
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
                                {/* Avatar (Only if prev msg is different user) */}
                                <div className={`w-8 h-8 shrink-0 ${isPrevSame ? 'opacity-0 h-0' : ''}`}>
                                    <img src={msg.avatar} className="w-8 h-8 rounded-full border border-black/5 shadow-sm bg-white" alt="avatar" />
                                </div>

                                {/* Bubble */}
                                <div className={`
                                    px-3 py-1.5 shadow-sm relative break-words text-sm
                                    ${isMe 
                                        ? 'bg-[#e7ffdb] text-gray-900 rounded-l-lg rounded-br-lg' // WhatsApp Light Green
                                        : msg.isAdmin 
                                            ? 'bg-wedding-50 border border-wedding-200 text-gray-900 rounded-r-lg rounded-bl-lg'
                                            : 'bg-white text-gray-900 rounded-r-lg rounded-bl-lg'
                                    }
                                    ${isPrevSame ? (isMe ? 'rounded-tr-lg mt-0.5' : 'rounded-tl-lg mt-0.5') : 'rounded-t-lg mt-2'}
                                `}>
                                    {!isMe && !isPrevSame && (
                                        <p className={`text-[11px] font-bold mb-0.5 leading-tight ${msg.isAdmin ? 'text-wedding-600 flex items-center gap-1' : 'text-orange-600'}`}>
                                            {msg.userName}
                                            {msg.isAdmin && (
                                                <span className="bg-wedding-600 text-white text-[9px] px-1 rounded-[3px] uppercase tracking-wider">Yönetici</span>
                                            )}
                                        </p>
                                    )}
                                    <p className="whitespace-pre-wrap leading-snug">{msg.text}</p>
                                    <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-green-800/60' : 'text-gray-400'}`}>
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
        <div className="bg-[#f0f2f5] px-2 py-2 border-t border-gray-200 z-20 flex items-center gap-2">
            <button className="text-gray-500 p-2 hover:bg-gray-200 rounded-full transition-colors hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>

            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 items-center">
                <input 
                    type="text" 
                    className="flex-1 bg-white border-0 rounded-lg px-4 py-2.5 text-sm focus:ring-0 focus:outline-none placeholder-gray-500 shadow-sm"
                    placeholder="Bir mesaj yazın"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className={`
                        p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-md flex-shrink-0
                        ${newMessage.trim() 
                            ? 'bg-wedding-500 hover:bg-wedding-600 text-white transform active:scale-95' 
                            : 'bg-transparent text-gray-400 shadow-none cursor-default'
                        }
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </form>
        </div>
    </div>
  );
};
