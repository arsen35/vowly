
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { ChatMessage, User, Conversation } from '../types';
import { Button } from './Button';

interface ChatPageProps {
  isAdmin: boolean;
  currentUser: User | null;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isAdmin, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'direct'>('global');
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
            // Katılımcıların detaylarını çek
            const enriched = await Promise.all(convs.map(async (c) => {
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
    if (activeConv) {
        const unsubscribe = dbService.subscribeToDirectMessages(activeConv.id, setDmMessages);
        return () => unsubscribe();
    }
  }, [activeConv]);

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

  const startDM = (targetUser: User) => {
    const convId = dbService.getConversationId(currentUser!.id, targetUser.id);
    setActiveConv({
        id: convId,
        participants: [currentUser!.id, targetUser.id],
        otherUser: targetUser
    });
    setSearchTerm('');
    setSearchResults([]);
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
    try {
        await dbService.sendDirectMessage(currentUser!, activeConv.otherUser!.id, newMessage);
        setNewMessage('');
    } finally { setIsSending(false); }
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
    <div className="flex flex-col h-[calc(100dvh-64px)] bg-white dark:bg-theme-black relative">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50">
            <button 
                onClick={() => { setActiveTab('global'); setActiveConv(null); }}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'global' ? 'text-wedding-500 border-b-2 border-wedding-500' : 'text-gray-400'}`}
            >
                Genel Sohbet
            </button>
            <button 
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'direct' ? 'text-wedding-500 border-b-2 border-wedding-500' : 'text-gray-400'}`}
            >
                Mesajlarım
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'global' ? (
                /* GLOBAL CHAT */
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {globalMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${msg.userId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <img src={msg.avatar} className="w-7 h-7 rounded-md object-cover" />
                                    <div className={`p-2.5 rounded-lg text-sm ${msg.userId === currentUser.id ? 'bg-wedding-500 text-white' : 'bg-gray-100 dark:bg-zinc-900 dark:text-white'}`}>
                                        <p className="text-[10px] font-bold opacity-70 mb-1">{msg.userName}</p>
                                        <p className="leading-snug">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendGlobal} className="p-3 border-t border-gray-100 dark:border-zinc-900 flex gap-2">
                        <input 
                            value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-zinc-900 rounded-md px-4 py-2.5 text-sm outline-none border border-gray-100 dark:border-zinc-800 focus:border-wedding-500"
                            placeholder="Bir şeyler yaz..."
                        />
                        <button className="bg-wedding-500 text-white p-2.5 rounded-md"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></button>
                    </form>
                </>
            ) : (
                /* DIRECT MESSAGES */
                <div className="flex flex-col h-full">
                    {!activeConv ? (
                        <>
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-900">
                                <div className="relative">
                                    <input 
                                        value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-900 rounded-md pl-10 pr-4 py-2 text-xs outline-none border border-gray-100 dark:border-zinc-800"
                                        placeholder="@kullaniciadi ile ara..."
                                    />
                                    <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-md shadow-xl absolute z-50 w-[calc(100%-2rem)]">
                                        {searchResults.map(u => (
                                            <div key={u.id} onClick={() => startDM(u)} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b last:border-0 border-gray-50 dark:border-zinc-800">
                                                <img src={u.avatar} className="w-8 h-8 rounded-md" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold dark:text-white">{u.name}</span>
                                                    <span className="text-[10px] text-wedding-500 italic">@{u.username || u.id.slice(0,5)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {conversations.map(c => (
                                    <div key={c.id} onClick={() => setActiveConv(c)} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer border-b border-gray-50 dark:border-zinc-900/50">
                                        <img src={c.otherUser?.avatar} className="w-12 h-12 rounded-md object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-sm font-bold dark:text-white">{c.otherUser?.name}</span>
                                                <span className="text-[9px] text-gray-400">{c.lastMessageTimestamp ? new Date(c.lastMessageTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate italic">@{c.otherUser?.username || 'Gelin Adayı'}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{c.lastMessage}</p>
                                        </div>
                                    </div>
                                ))}
                                {conversations.length === 0 && (
                                    <div className="py-20 text-center opacity-30 italic text-xs">Henüz mesajın yok.</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-5">
                            <div className="p-3 border-b border-gray-100 dark:border-zinc-900 flex items-center gap-3 bg-gray-50/30 dark:bg-zinc-900/30">
                                <button onClick={() => setActiveConv(null)} className="p-1 text-gray-400 hover:text-wedding-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" /></svg></button>
                                <img src={activeConv.otherUser?.avatar} className="w-8 h-8 rounded-md" />
                                <div>
                                    <p className="text-xs font-bold dark:text-white leading-none">{activeConv.otherUser?.name}</p>
                                    <p className="text-[9px] text-wedding-500 font-medium italic">@{activeConv.otherUser?.username}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                                {dmMessages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${m.senderId === currentUser.id ? 'bg-wedding-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 dark:text-white'}`}>
                                            {m.text}
                                            <span className={`block text-[8px] text-right mt-1 opacity-60`}>{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendDM} className="p-3 border-t border-gray-100 dark:border-zinc-900 flex gap-2">
                                <input 
                                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 bg-gray-50 dark:bg-zinc-900 rounded-md px-4 py-2.5 text-sm outline-none border border-gray-100 dark:border-zinc-800"
                                    placeholder="Mesaj yaz..."
                                />
                                <button className="bg-wedding-500 text-white p-2.5 rounded-md"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
