
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { ChatMessage, User, Conversation, ViewState } from '../types';
import { Button } from './Button';
import { AuthModal } from './AuthModal';
import { ConfirmationModal } from './ConfirmationModal';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // DM States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Deletion States
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const [menuConvId, setMenuConvId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setMenuConvId(null);
        }
    };
    if (menuConvId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuConvId]);

  const startDM = (targetUser: User) => {
    if (!currentUser) return;
    const convId = dbService.getConversationId(currentUser.id, targetUser.id);
    const existing = conversations.find(c => c.id === convId);
    
    if (existing) {
        setActiveConv(existing);
    } else {
        setActiveConv({
            id: convId,
            participants: [currentUser.id, targetUser.id],
            otherUser: targetUser,
            unreadBy: []
        });
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleLongPressStart = (conv: Conversation) => {
      longPressTimer.current = setTimeout(() => {
          setMenuConvId(conv.id);
          if ('vibrate' in navigator) navigator.vibrate(50);
      }, 700);
  };

  const handleLongPressEnd = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDeleteConversation = async () => {
      if (!convToDelete) return;
      try {
          await dbService.deleteConversation(convToDelete.id);
          if (activeConv?.id === convToDelete.id) setActiveConv(null);
      } catch (err) {
          console.error("Deletion failed", err);
      } finally {
          setConvToDelete(null);
          setMenuConvId(null);
      }
  };

  useEffect(() => {
    if (initialUser && currentUser && conversations.length >= 0) {
        startDM(initialUser);
        onLoaded?.();
    }
  }, [initialUser, currentUser, conversations.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
    if (!newMessage.trim() || !activeConv || isSending || !currentUser) return;
    setIsSending(true);
    const msgText = newMessage;
    setNewMessage('');
    try {
        await dbService.sendDirectMessage(currentUser, activeConv.otherUser!.id, msgText);
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
          <div className="flex flex-col items-center justify-center h-[calc(100dvh-120px)] text-center p-8 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-wedding-50 dark:bg-zinc-900/50 flex items-center justify-center text-wedding-500 mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              </div>
              <h2 className="font-serif text-2xl font-bold mb-4 uppercase tracking-[0.2em] dark:text-white">Sohbete Katıl</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-8 max-w-xs">Diğer gelin adaylarıyla mesajlaşmak ve DM göndermek için giriş yapmalısın.</p>
              <Button onClick={() => setShowAuthModal(true)} className="w-full max-w-[240px] py-4 uppercase tracking-widest text-xs">Giriş Yap / Kaydol</Button>
              {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => window.location.reload()} />}
          </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-56px)] bg-white dark:bg-theme-black relative transition-colors overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50 shrink-0">
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

        <div className="flex-1 overflow-hidden flex flex-col relative">
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
                    {/* INPUT AREA */}
                    <form onSubmit={handleSendGlobal} className="p-3 border-t border-gray-100 dark:border-zinc-900 flex gap-2 bg-white dark:bg-theme-black items-center shrink-0">
                        <input 
                            value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-zinc-900 rounded-[5px] px-4 py-3 text-xs outline-none border border-gray-100 dark:border-zinc-800 focus:border-wedding-500 focus:bg-white dark:focus:bg-zinc-950 transition-all"
                            placeholder="Bir şeyler yaz..."
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="bg-wedding-500 text-white w-10 h-10 flex items-center justify-center rounded-[5px] shrink-0 transition-all active:scale-90 hover:bg-wedding-600 shadow-md shadow-wedding-500/20 disabled:opacity-30">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                        </button>
                    </form>
                </>
            ) : (
                <div className="flex flex-col h-full bg-white dark:bg-theme-black overflow-hidden">
                    {!activeConv ? (
                        <>
                            <div className="px-5 py-4 border-b border-gray-50 dark:border-zinc-900/50 shrink-0">
                                <div className="relative group flex items-center">
                                    <svg className="w-4 h-4 absolute left-4 text-gray-400 group-focus-within:text-wedding-500 transition-colors pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full bg-gray-100/50 dark:bg-zinc-900 rounded-[5px] pl-11 pr-5 py-2.5 text-xs outline-none border border-transparent focus:border-wedding-500 focus:bg-white dark:focus:bg-zinc-950 transition-all shadow-sm dark:text-white"
                                        placeholder="@kullaniciadi ile ara ve yaz..."
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[5px] shadow-2xl absolute left-5 right-5 z-[60] animate-in fade-in slide-in-from-top-1 overflow-hidden">
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
                                        <div 
                                            key={c.id} 
                                            onClick={() => setActiveConv(c)}
                                            onPointerDown={() => handleLongPressStart(c)}
                                            onPointerUp={handleLongPressEnd}
                                            onPointerLeave={handleLongPressEnd}
                                            className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-zinc-900/30 cursor-pointer border-b border-gray-50 dark:border-zinc-900/30 transition-all relative ${isUnread ? 'bg-wedding-50/20 dark:bg-wedding-500/5' : ''}`}
                                        >
                                            <div className="relative">
                                                <img src={c.otherUser?.avatar} className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                {isUnread && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse flex items-center justify-center text-[8px] text-white font-bold">!</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-sm dark:text-white truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>{c.otherUser?.name}</span>
                                                    <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">{c.lastMessageTimestamp ? new Date(c.lastMessageTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                                                </div>
                                                <p className={`text-[12px] truncate ${isUnread ? 'font-bold text-gray-900 dark:text-gray-200' : 'text-gray-400'}`}>{c.lastMessage || 'Mesajlaşmaya başlayın...'}</p>
                                            </div>

                                            {/* Action Menu (3 Dot) */}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setMenuConvId(c.id === menuConvId ? null : c.id); }}
                                                    className="p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                                                </button>
                                                {menuConvId === c.id && (
                                                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setConvToDelete(c); }}
                                                            className="w-full text-left px-4 py-3 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                            Sohbeti Sil
                                                        </button>
                                                    </div>
                                                )}
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
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 absolute inset-0 z-[70] bg-white dark:bg-theme-black">
                            {/* CONV HEADER */}
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex items-center gap-4 bg-white/80 dark:bg-theme-black/80 backdrop-blur-md shrink-0">
                                <button onClick={() => setActiveConv(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg></button>
                                <img src={activeConv.otherUser?.avatar} className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold dark:text-white leading-none truncate">{activeConv.otherUser?.name}</p>
                                    <p className="text-[10px] text-wedding-500 font-bold italic mt-1.5 uppercase tracking-widest">@{activeConv.otherUser?.username || 'üye'}</p>
                                </div>
                                <button 
                                    onClick={() => setConvToDelete(activeConv)}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    title="Sohbeti Sil"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                            </div>
                            {/* MESSAGES */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
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
                            {/* DM INPUT AREA */}
                            <form onSubmit={handleSendDM} className="p-3 border-t border-gray-100 dark:border-zinc-900 flex gap-2 bg-white dark:bg-theme-black items-center shrink-0">
                                <input 
                                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 bg-gray-50 dark:bg-zinc-900 rounded-[5px] px-4 py-3 text-xs outline-none border border-gray-100 dark:border-zinc-800 focus:border-wedding-500 focus:bg-white dark:focus:bg-zinc-950 transition-all shadow-inner"
                                    placeholder="Mesajını yaz..."
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

        <ConfirmationModal 
            isOpen={!!convToDelete}
            title="Sohbeti Sil"
            message={`${convToDelete?.otherUser?.name} ile olan tüm mesajlaşma geçmişiniz kalıcı olarak silinecektir.`}
            onConfirm={handleDeleteConversation}
            onCancel={() => { setConvToDelete(null); setMenuConvId(null); }}
        />
    </div>
  );
};
