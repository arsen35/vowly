
import React, { useState, useRef } from 'react';
import { Post, User } from '../types';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
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
  const [activeTab, setActiveTab] = useState<'grid' | 'saved'>('grid');
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editWeddingDate, setEditWeddingDate] = useState(user?.weddingDate || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    if (auth && window.confirm("Oturumu kapatmak istediğinize emin misiniz?")) {
        await signOut(auth);
        onLogout();
        window.location.reload();
    }
  };

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
            weddingDate: editWeddingDate,
            avatar: editAvatar
        });
        setIsEditModalOpen(false);
    } catch (e) {
        alert("Profil güncellenirken bir hata oluştu.");
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fadeIn">
        <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-full mb-4 flex items-center justify-center text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
        </div>
        <h2 className="text-xl font-serif font-bold dark:text-white">Henüz bir profilin yok</h2>
        <Button onClick={() => window.location.reload()} className="mt-4">Giriş Yap</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-10 pb-20 animate-fadeIn">
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

        <div className="flex items-center gap-8 md:gap-20">
            <div className="relative group cursor-pointer shrink-0">
                <div className="w-20 h-20 md:w-36 md:h-36 rounded-full p-[3px] border-2 border-wedding-500 shadow-sm overflow-hidden">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </div>
            </div>

            <div className="flex-1 flex justify-around md:justify-start md:gap-16 text-center">
                <div>
                    <div className="text-sm md:text-lg font-bold dark:text-white">{userPosts.length}</div>
                    <div className="text-[11px] md:text-sm text-gray-400">gönderi</div>
                </div>
            </div>
        </div>

        <div className="space-y-0.5">
            <h3 className="text-sm font-bold dark:text-white">{user.name}</h3>
            <p className="text-sm dark:text-gray-300 leading-snug whitespace-pre-line">{user.bio || "Annabella gelini ✨"}</p>
        </div>

        <div className="flex gap-2">
            <button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-white text-xs font-bold py-3 rounded-lg transition-colors border border-gray-100 dark:border-zinc-800">Profili Düzenle</button>
            <button onClick={handleLogout} className="flex-1 bg-red-50 text-red-500 text-xs font-bold py-3 rounded-lg transition-colors border border-red-100 hover:bg-red-500 hover:text-white">Çıkış Yap</button>
        </div>

        {showSettings && (
            <div className="fixed inset-0 bg-black/60 z-[1100] flex items-end animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
                <div className="w-full bg-white dark:bg-theme-dark rounded-t-3xl p-6 space-y-2 animate-in slide-in-from-bottom-5 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="w-12 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full mx-auto mb-6"></div>
                    <button onClick={handleLogout} className="w-full text-center py-4 text-sm font-bold text-red-500 border border-red-100 bg-red-50 rounded-2xl">
                        Oturumu Kapat
                    </button>
                    <button onClick={onDeleteAccount} className="w-full text-center py-4 text-sm font-bold text-gray-400">
                        Hesabı Sil
                    </button>
                    <button onClick={() => setShowSettings(false)} className="w-full text-center py-4 text-sm font-bold text-gray-900 dark:text-white mt-4">Kapat</button>
                </div>
            </div>
        )}
      </div>

      <div className="flex border-t dark:border-zinc-800 mt-10">
        <button className={`flex-1 flex items-center justify-center py-4 border-t-2 border-gray-900 dark:border-white text-gray-900 dark:text-white`}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>
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
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-theme-dark rounded-3xl w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-300 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center mb-8"><h3 className="text-xl font-serif font-bold dark:text-white">Profili Düzenle</h3></div>
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <img src={editAvatar} onClick={() => avatarInputRef.current?.click()} className="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-wedding-500 p-0.5" />
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    </div>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none" placeholder="Ad Soyad" />
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none h-24" placeholder="Biyografi" />
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full">Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-3 text-xs text-gray-400 font-bold uppercase tracking-widest">Vazgeç</button>
                </div>
            </div>
        </div>
      )}
      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Emin misin?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
