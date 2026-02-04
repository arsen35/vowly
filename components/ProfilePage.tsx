
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
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const userPosts = posts.filter(p => p.user.id === user?.id);
  const likedPosts = posts.filter(p => p.isLikedByCurrentUser);
  const displayPosts = activeTab === 'posts' ? userPosts : likedPosts;

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
    <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-12 pb-24 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-8 mb-10">
        <div className="flex items-center gap-6 md:gap-14">
            <div className="shrink-0">
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] border border-wedding-500/20 overflow-hidden shadow-sm">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </div>
            </div>

            <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl md:text-2xl font-bold dark:text-white tracking-tight">{user.name}</h2>
                    <button 
                        onClick={() => setShowSettings(true)} 
                        className="p-2 text-gray-400 hover:text-wedding-500 transition-colors"
                    >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                    </button>
                </div>

                <div className="flex gap-8">
                    <div className="text-center md:text-left">
                        <span className="text-sm font-bold dark:text-white">{userPosts.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1.5">Gönderi</span>
                    </div>
                    <div className="text-center md:text-left">
                        <span className="text-sm font-bold dark:text-white">{likedPosts.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1.5">Beğeni</span>
                    </div>
                </div>
                
                <p className="hidden md:block text-sm dark:text-gray-400 leading-snug font-light italic">
                    {user.bio || "Hayalindeki gelinliği Annabella'da buldu ✨"}
                </p>
            </div>
        </div>

        <p className="md:hidden text-sm dark:text-gray-400 leading-snug font-light italic -mt-2">
            {user.bio || "Hayalindeki gelinliği Annabella'da buldu ✨"}
        </p>

        {/* 3 EQUAL STROKE BUTTONS */}
        <div className="flex gap-3">
            <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-wedding-500 hover:text-wedding-500 text-gray-500 dark:text-gray-400 text-[10px] font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.1em] text-center"
            >
                Düzenle
            </button>
            
            <button 
                onClick={() => setActiveTab(activeTab === 'posts' ? 'liked' : 'posts')}
                className={`flex-1 bg-transparent border ${activeTab === 'liked' ? 'border-wedding-500 text-wedding-500' : 'border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400'} hover:border-wedding-500 hover:text-wedding-500 text-[10px] font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.1em]`}
            >
                {activeTab === 'posts' ? 'Beğeniler' : 'Gönderiler'}
            </button>

            <a 
                href="https://annabellabridal.com" 
                target="_blank"
                className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-wedding-500 hover:text-wedding-500 text-gray-500 dark:text-gray-400 text-[10px] font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.1em] flex items-center justify-center gap-2"
            >
                Website
            </a>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="flex border-b dark:border-zinc-800 mb-4">
        <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex flex-col items-center justify-center py-4 transition-all relative ${activeTab === 'posts' ? 'text-wedding-500' : 'text-gray-400'}`}
        >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>
            <span className="text-[8px] font-bold uppercase tracking-widest">Paylaşımlar</span>
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-wedding-500 animate-in slide-in-from-left-full"></div>}
        </button>
        <button 
            onClick={() => setActiveTab('liked')}
            className={`flex-1 flex flex-col items-center justify-center py-4 transition-all relative ${activeTab === 'liked' ? 'text-wedding-500' : 'text-gray-400'}`}
        >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            <span className="text-[8px] font-bold uppercase tracking-widest">Beğenilenler</span>
            {activeTab === 'liked' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-wedding-500 animate-in slide-in-from-right-full"></div>}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-1">
        {displayPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900 animate-fadeIn">
            <img src={post.media[0].url} alt="Post" onClick={() => onPostClick(post)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {activeTab === 'posts' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setPostToDelete(post.id); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
            {activeTab === 'liked' && (
                <div className="absolute bottom-2 left-2 p-1 bg-black/30 rounded-full">
                    <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                </div>
            )}
          </div>
        ))}
        {displayPosts.length === 0 && (
            <div className="col-span-3 py-24 text-center opacity-30 italic font-serif">
                {activeTab === 'posts' ? 'Henüz paylaşımınız yok.' : 'Beğendiğiniz bir gönderi bulunmuyor.'}
            </div>
        )}
      </div>

      {/* SETTINGS SHEET */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-[1100] flex items-end animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
              <div className="w-full bg-white dark:bg-[#121212] rounded-t-3xl p-6 pb-12 space-y-3 animate-in slide-in-from-bottom-5 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6"></div>
                  
                  <button onClick={onLogout} className="w-full text-center py-4 text-xs font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 uppercase tracking-[0.2em]">
                      Oturumu Kapat
                  </button>

                  <button 
                      onClick={() => { setShowSettings(false); onDeleteAccount(); }} 
                      className="w-full text-center py-4 text-xs font-bold text-red-500 border border-red-100 dark:border-red-900/10 bg-red-50 dark:bg-red-900/10 rounded-2xl uppercase tracking-[0.2em]"
                  >
                      Hesabı Sil
                  </button>

                  <button onClick={() => setShowSettings(false)} className="w-full text-center py-4 text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Vazgeç</button>
              </div>
          </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-theme-dark rounded-[32px] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center mb-8"><h3 className="text-xl font-serif font-bold dark:text-white">Profili Düzenle</h3></div>
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <img src={editAvatar} onClick={() => avatarInputRef.current?.click()} className="w-24 h-24 rounded-full object-cover cursor-pointer border-2 border-wedding-500/20 p-1" />
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    </div>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none border border-gray-100 dark:border-zinc-800 focus:border-wedding-500 transition-colors" placeholder="Ad Soyad" />
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none h-24 border border-gray-100 dark:border-zinc-800 resize-none focus:border-wedding-500 transition-colors" placeholder="Biyografi" />
                </div>
                <div className="mt-8">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-xl shadow-none">Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Vazgeç</button>
                </div>
            </div>
        </div>
      )}
      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Bu anı kalıcı olarak silmek istediğinize emin misiniz?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
