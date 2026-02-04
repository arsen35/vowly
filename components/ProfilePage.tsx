
import React, { useState, useRef } from 'react';
import { Post, User } from '../types';
import { dbService } from '../services/db';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';

interface ProfilePageProps {
  user: User | null;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onDeletePost: (postId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  posts, 
  onPostClick, 
  onLogout, 
  onDeleteAccount,
  onDeletePost
}) => {
  const userPosts = posts.filter(p => p.user.id === user?.id);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const processAvatar = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 300;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx?.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await processAvatar(e.target.files[0]);
      setEditAvatar(base64);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        await dbService.updateUser(user.id, {
            name: editName,
            bio: editBio,
            avatar: editAvatar
        });
        setIsEditModalOpen(false);
    } catch (e) {
        alert("Profil güncellenirken bir hata oluştu.");
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-10 pb-24 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6 mb-8 relative">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-900 dark:text-white"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <h2 className="font-bold text-lg dark:text-white tracking-tight">{user.name.toLowerCase().replace(/\s/g, '_')}</h2>
            </div>
            <button 
                onClick={() => setShowSettings(true)} 
                className="p-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
        </div>

        <div className="flex items-center gap-6 md:gap-16">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-[2px] border border-wedding-500 shadow-sm overflow-hidden shrink-0">
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            </div>

            <div className="flex flex-col gap-4 flex-1">
                <div className="flex justify-around md:justify-start md:gap-12">
                    <div className="text-center md:text-left">
                        <div className="text-lg font-bold dark:text-white">{userPosts.length}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Gönderi</div>
                    </div>
                    <div className="text-center md:text-left">
                        <div className="text-lg font-bold dark:text-white">Annabel</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Gelin Tipi</div>
                    </div>
                </div>
                
                <div className="hidden md:block">
                    <h3 className="text-sm font-bold dark:text-white mb-1">{user.name}</h3>
                    <p className="text-sm dark:text-gray-300 leading-snug whitespace-pre-line">{user.bio || "Hayalindeki gelinliği Annabella'da buldu ✨"}</p>
                </div>
            </div>
        </div>

        <div className="md:hidden">
            <h3 className="text-sm font-bold dark:text-white mb-1">{user.name}</h3>
            <p className="text-sm dark:text-gray-300 leading-snug whitespace-pre-line">{user.bio || "Hayalindeki gelinliği Annabella'da buldu ✨"}</p>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="flex-[2] bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-white text-xs font-bold py-3 rounded-lg transition-colors border border-gray-100 dark:border-zinc-800 uppercase tracking-widest"
            >
                Profili Düzenle
            </button>
            <a 
                href="https://annabellabridal.com/collections/all" 
                target="_blank" 
                className="flex-[3] bg-wedding-500 text-white text-xs font-bold py-3 rounded-lg transition-all border border-wedding-500 hover:bg-wedding-600 flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-wedding-500/20"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                Koleksiyonu İncele
            </a>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="flex border-t dark:border-zinc-800 mt-10">
        <button className="flex-1 flex items-center justify-center py-4 border-t-2 border-gray-900 dark:border-white">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-900 dark:text-white"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-0.5 md:gap-1.5 mt-0.5">
        {userPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900">
            <img src={post.media[0].url} alt="Post" onClick={() => onPostClick(post)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <button 
                onClick={(e) => { e.stopPropagation(); setPostToDelete(post.id); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
        {userPosts.length === 0 && (
            <div className="col-span-3 py-20 text-center opacity-30 italic font-serif">Henüz bir fotoğraf paylaşmadınız.</div>
        )}
      </div>

      {/* SETTINGS SHEET */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-[1100] flex items-end animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
              <div className="w-full bg-white dark:bg-[#121212] rounded-t-3xl p-6 pb-12 space-y-3 animate-in slide-in-from-bottom-5 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6"></div>
                  
                  <button onClick={() => { setShowSettings(false); setIsEditModalOpen(true); }} className="w-full text-center py-4 text-sm font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 uppercase tracking-widest">
                      Profili Düzenle
                  </button>
                  
                  <button onClick={onLogout} className="w-full text-center py-4 text-sm font-bold text-wedding-500 border border-wedding-100 dark:border-wedding-900 bg-wedding-50 dark:bg-wedding-900/20 rounded-2xl uppercase tracking-widest">
                      Oturumu Kapat
                  </button>

                  <button 
                      onClick={() => { setShowSettings(false); onDeleteAccount(); }} 
                      className="w-full text-center py-4 text-sm font-bold text-red-500 border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-2xl uppercase tracking-widest"
                  >
                      Hesabı Sil
                  </button>

                  <button onClick={() => setShowSettings(false)} className="w-full text-center py-4 text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Vazgeç</button>
              </div>
          </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-theme-dark rounded-3xl w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-300 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center mb-8"><h3 className="text-xl font-serif font-bold dark:text-white">Profili Düzenle</h3></div>
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <img src={editAvatar} onClick={() => avatarInputRef.current?.click()} className="w-24 h-24 rounded-full object-cover cursor-pointer border-2 border-wedding-500 p-0.5 shadow-md" />
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    </div>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none border border-gray-100 dark:border-zinc-800" placeholder="Ad Soyad" />
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none h-24 border border-gray-100 dark:border-zinc-800" placeholder="Biyografi" />
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-xl">Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-3 text-xs text-gray-400 font-bold uppercase tracking-widest">Vazgeç</button>
                </div>
            </div>
        </div>
      )}
      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Bu anı kalıcı olarak silmek istediğinize emin misiniz?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
