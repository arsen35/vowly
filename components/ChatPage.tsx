
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { ChatMessage, User, Conversation } from '../types';
import { Button } from './Button';

interface ChatPageProps {
  isAdmin: boolean;
  currentUser: User | null;
  initialUser?: User | null;
  onLoaded?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isAdmin, currentUser, initialUser, onLoaded }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'direct'>('direct');
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // DM States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'global') {
        const unsubscribe = dbService.subscribeToChat(setGlobalMessages);
        return () => unsubscribe();
    } else if (currentUser) {
        const unsubscribe = dbService.subscribeToConversations(currentUser.id, async (convs) => {
            const sortedConvs = [...convs].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
            
            const enriched = await Promise.all(sortedConvs.map(async (c) => {
                const otherUid = c.participants.find(p => p !== currentUser.id);
                const otherUser = otherUid ? await dbService.getUser(otherUid) : null;
                return { ...c, otherUser: otherUser || undefined };
            }));
            setConversations(enriched);
        });
        return () => unsubscribe();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (activeConv && currentUser) {
        dbService.markConversationAsRead(activeConv.id, currentUser.id);
        const unsubscribe = dbService.subscribeToDirectMessages(activeConv.id, (msgs) => {
            setDmMessages(msgs);
        });
        return () => unsubscribe();
    }
  }, [activeConv, currentUser]);

  const startDM = (targetUser: User) => {
    const convId = dbService.getConversationId(currentUser!.id, targetUser.id);
    const existing = conversations.find(c => c.id === convId);
    
    if (existing) {
        setActiveConv(existing);
    } else {
        setActiveConv({
            id: convId,
            participants: [currentUser!.id, targetUser.id],
            otherUser: targetUser,
            unreadBy: []
        });
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (initialUser && currentUser && conversations.length >= 0) {
        startDM(initialUser);
        onLoaded?.();
    }
  }, [initialUser, conversations.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages, dmMessages, activeConv]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length > 1) {
        setIsSearching(true);
        const users = await dbService.searchUsers(val);
        setSearchResults(users.filter(u => u.id !== currentUser?.id));
        setIsSearching(false);
    } else {
        setSearchResults([]);
    }
  };

  const handleSendGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || isSending) return;
    setIsSending(true);
    try {
        await dbService.sendChatMessage({
            text: newMessage,
            userId: currentUser.id,
            userName: currentUser.name,
            avatar: currentUser.avatar,
            timestamp: Date.now(),
            isAdmin: isAdmin
        });
        setNewMessage('');
    } finally { setIsSending(false); }
  };

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || isSending) return;
    setIsSending(true);
    const msgText = newMessage;
    setNewMessage('');
    try {
        await dbService.sendDirectMessage(currentUser!, activeConv.otherUser!.id, msgText);
    } catch (err) {
        setNewMessage(msgText);
    } finally { setIsSending(false); }
  };

  const isMessageSeen = (conv: Conversation | null) => {
    if (!conv || !currentUser) return false;
    const otherUid = conv.participants.find(p => p !== currentUser.id);
    return !conv.unreadBy?.includes(otherUid!);
  };

  if (!currentUser) {
      return (
          <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] text-center p-6">
              <h2 className="font-serif text-xl font-bold mb-4 uppercase tracking-widest">Sohbete Katıl</h2>
              <p className="text-sm text-gray-500 italic">Mesaj yazmak ve DM göndermek için lütfen profilinden giriş yap.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] bg-white dark:bg-theme-black relative transition-colors">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50">
            <button 
                onClick={() => { setActiveTab('global'); setActiveConv(null); }}
                className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'global' ? 'text-wedding-500 border-b-2 border-wedding-500' : 'text-gray-400'}`}
            >
                Genel Sohbet
            </button>
            <button 
                onClick={() => { setActiveTab('direct'); }}
                className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'direct' ? 'text-wedding-500 border-b-2 border-wedding-500' : 'text-gray-400'}`}
            >
                Mesajlarım
                {conversations.some(c => c.unreadBy?.includes(currentUser.id)) && (
                    <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></span>
                )}
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'global' ? (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {globalMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[85%] ${msg.userId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <img src={msg.avatar} className="w-8 h-8 rounded-md object-cover border border-gray-100 dark:border-zinc-800" />
                                    <div className={`p-3 rounded-[5px] text-[13px] shadow-sm ${msg.userId === currentUser.id ? 'bg-wedding-500 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-900 dark:text-white rounded-tl-none'}`}>
                                        <p className="text-[10px] font-bold opacity-70 mb-1">{msg.userName}</p>
                                        <p className="leading-snug">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    {/* GLOBAL CHAT INPUT - RADIUS: 5px */}
                    <form onSubmit={handleSendGlobal} className="p-3 border-t border-gray-100 dark:border-zinc-900 flex gap-2 bg-white dark:bg-theme-black items-center">
                        <input 
                            value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-zinc-900 rounded-[5px] px-4 py-2.5 text-xs outline-none border border-gray-100 dark:border-zinc-800 focus:border-wedding-500 focus:bg-white dark:focus:bg-zinc-950 transition-all"
                            placeholder="Mesaj yazın..."
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="bg-wedding-500 text-white w-10 h-10 flex items-center justify-center rounded-[5px] shrink-0 transition-all active:scale-90 hover:bg-wedding-600 shadow-md shadow-wedding-500/20 disabled:opacity-30 disabled:grayscale">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                        </button>
                    </form>
                </>
            ) : (
                <div className="flex flex-col h-full bg-white dark:bg-theme-black">
                    {!activeConv ? (
                        <>
                            <div className="px-5 py-4 border-b border-gray-50 dark:border-zinc-900/50">
                                <div className="relative group flex items-center">
                                    <svg className="w-4 h-4 absolute left-4 text-gray-400 group-focus-within:text-wedding-500 transition-colors pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full bg-gray-100/50 dark:bg-zinc-900 rounded-[5px] pl-11 pr-5 py-2.5 text-xs outline-none border border-transparent focus:border-wedding-500 focus:bg-white dark:focus:bg-zinc-950 transition-all shadow-sm dark:text-white"
                                        placeholder="@kullaniciadi ile ara ve yaz..."
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[5px] shadow-2xl absolute z-50 w-[calc(100%-2.5rem)] animate-in fade-in slide-in-from-top-1 overflow-hidden">
                                        {searchResults.map(u => (
                                            <div key={u.id} onClick={() => startDM(u)} className="p-4 flex items-center gap-4 hover:bg-wedding-50 dark:hover:bg-wedding-900/10 cursor-pointer border-b last:border-0 border-gray-50 dark:border-zinc-800/50 transition-all">
                                                <img src={u.avatar} className="w-10 h-10 rounded-lg object-cover" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold dark:text-white">{u.name}</span>
                                                    <span className="text-[10px] text-wedding-500 italic">@{u.username || 'üye'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {conversations.map(c => {
                                    const isUnread = c.unreadBy?.includes(currentUser.id);
                                    return (
                                        <div key={c.id} onClick={() => setActiveConv(c)} className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-zinc-900/30 cursor-pointer border-b border-gray-50 dark:border-zinc-900/30 transition-all ${isUnread ? 'bg-wedding-50/20 dark:bg-wedding-500/5' : ''}`}>
                                            <div className="relative">
                                                <img src={c.otherUser?.avatar} className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                {isUnread && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse flex items-center justify-center text-[8px] text-white font-bold">!</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-sm dark:text-white truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>{c.otherUser?.name}</span>
                                                    <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">{c.lastMessageTimestamp ? new Date(c.lastMessageTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                                                </div>
                                                <p className={`text-[12px] truncate ${isUnread ? 'font-bold text-gray-900 dark:text-gray-200' : 'text-gray-400'}`}>{c.lastMessage || 'Mesajlaşmaya başlayın...'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {conversations.length === 0 && (
                                    <div className="py-24 text-center flex flex-col items-center gap-6 animate-fadeIn">
                                        <div className="w-20 h-20 rounded-full bg-wedding-50 dark:bg-zinc-900/50 flex items-center justify-center text-wedding-200">
                                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-900 dark:text-white font-serif italic text-lg">Henüz sohbetin yok</p>
                                            <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">Arama çubuğundan birini bulup yazabilirsin</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex items-center gap-4 bg-white/80 dark:bg-theme-black/80 backdrop-blur-md sticky top-0 z-20">
                                <button onClick={() => setActiveConv(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg></button>
                                <img src={activeConv.otherUser?.avatar} className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold dark:text-white leading-none truncate">{activeConv.otherUser?.name}</p>
                                    <p className="text-[10px] text-wedding-500 font-bold italic mt-1.5 uppercase tracking-widest">@{activeConv.otherUser?.username || 'üye'}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-white dark:bg-theme-black">
                                {dmMessages.map((m, idx) => {
                                    const isLastMessage = idx === dmMessages.length - 1;
                                    const currentC = conversations.find(c => c.id === activeConv.id);
                                    const isSeen = isMessageSeen(currentC || null);
                                    
                                    return (
                                        <div key={m.id} className={`flex flex-col ${m.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2.5 rounded-[5px] text-[13px] max-w-[80%] shadow-sm leading-snug ${m.senderId === currentUser.id ? 'bg-wedding-500 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-900 dark:text-white rounded-tl-none'}`}>
                                                {m.text}
                                                <span className={`block text-[8px] text-right mt-1.5 opacity-60 font-bold`}>{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            {m.senderId === currentUser.id && isLastMessage && (
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isSeen ? 'text-blue-500' : 'text-gray-400'}`}>
                                                        {isSeen ? 'Görüldü' : 'İletildi'}
                                                    </span>
                                                    <span className={`text-[10px] ${isSeen ? 'text-blue-500' : 'text-gray-400'}`}>
                                                        {isSeen ? '✓✓' : '✓'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            {/* DM INPUT - RADIUS: 5px */}
                            <form onSubmit={handleSendDM} className="p-3 border-t border-gray-100 dark:border-zinc-900 flex gap-2 bg-white dark:bg-theme-black items-center">
                                <input 
                                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 bg-gray-50 dark:bg-zinc-900 rounded-[5px] px-4 py-2.5 text-xs outline-none border border-gray-100 dark:border-zinc-800 focus:border-wedding-500 focus:bg-white dark:focus:bg-zinc-950 transition-all shadow-inner"
                                    placeholder="Mesaj yazın..."
                                />
                                <button type="submit" disabled={!newMessage.trim()} className="bg-wedding-500 text-white w-10 h-10 flex items-center justify-center rounded-[5px] shrink-0 transition-all active:scale-90 hover:bg-wedding-600 shadow-md shadow-wedding-500/20 disabled:opacity-30 disabled:grayscale">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
