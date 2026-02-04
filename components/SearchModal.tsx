
import React, { useState } from 'react';
import { dbService } from '../services/db';
import { User } from '../types';

interface SearchModalProps {
  onClose: () => void;
  followingIds: string[];
  onFollowToggle: (userId: string) => void;
  currentUserId?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose, followingIds, onFollowToggle, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.trim().length > 1) {
        setIsLoading(true);
        try {
            const users = await dbService.searchUsers(val);
            setResults(users);
        } catch (e) {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    } else {
        setResults([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Kullanıcı Ara</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-wedding-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="relative mb-6">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
                autoFocus
                type="text" 
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-4 text-xs dark:text-white outline-none focus:border-wedding-500 transition-all"
                placeholder="@kullaniciadi veya isim..."
            />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {isLoading ? (
                <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-wedding-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <>
                    {results.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-3">
                                <img src={u.avatar} className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-zinc-800" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold dark:text-white leading-tight">{u.name}</span>
                                    <span className="text-[10px] text-wedding-500 font-bold">@{u.username || 'uye'}</span>
                                </div>
                            </div>
                            {u.id !== currentUserId && (
                                <button 
                                    onClick={() => onFollowToggle(u.id)}
                                    className={`text-[9px] font-bold px-4 py-2 rounded-lg border transition-all uppercase tracking-widest ${followingIds.includes(u.id) ? 'border-gray-100 dark:border-zinc-800 text-gray-400' : 'border-wedding-500 text-wedding-500 hover:bg-wedding-500 hover:text-white'}`}
                                >
                                    {followingIds.includes(u.id) ? 'Takip' : 'Takip Et'}
                                </button>
                            )}
                        </div>
                    ))}
                    {searchTerm.length > 1 && results.length === 0 && !isLoading && (
                        <div className="py-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sonuç Bulunamadı ✨</div>
                    )}
                    {searchTerm.length <= 1 && (
                        <div className="py-12 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] leading-relaxed">
                            Aramak istediğin kişinin <br/> kullanıcı adını yaz
                        </div>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};
