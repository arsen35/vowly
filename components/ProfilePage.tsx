
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
  
  // Edit States
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editWeddingDate, setEditWeddingDate] = useState(user?.weddingDate || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        onLogout();
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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full mb-4 flex items-center justify-center text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
        </div>
        <h2 className="text-xl font-serif font-bold dark:text-white">Henüz bir profilin yok</h2>
        <Button onClick={() => window.location.reload()} className="mt-4">Giriş Yap</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-10 pb-20 animate-fadeIn">
      {/* IG STYLE HEADER */}
      <div className="flex flex-col gap-6 mb-8 relative">
        {/* Top Bar (Mobile Focus) */}
        <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-900 dark:text-white"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <h2 className="font-bold text-lg dark:text-white tracking-tight">{user.name.toLowerCase().replace(/\s/g, '_')}</h2>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-500"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="p-1 text-gray-900 dark:text-white">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
        </div>

        {/* Profile Info Row */}
        <div className="flex items-center gap-8 md:gap-20">
            {/* Avatar with IG Ring */}
            <div className="relative group cursor-pointer shrink-0">
                <div className="w-20 h-20 md:w-36 md:h-36 rounded-full p-[3px] border-2 border-wedding-500 shadow-sm overflow-hidden">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 bg-wedding-500 text-white rounded-full border-2 border-white dark:border-black p-0.5">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
            </div>

            {/* Stats */}
            <div className="flex-1 flex justify-around md:justify-start md:gap-16 text-center">
                <div>
                    <div className="text-sm md:text-lg font-bold dark:text-white">{userPosts.length}</div>
                    <div className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400">gönderi</div>
                </div>
                <div>
                    <div className="text-sm md:text-lg font-bold dark:text-white">124</div>
                    <div className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400">takipçi</div>
                </div>
                <div>
                    <div className="text-sm md:text-lg font-bold dark:text-white">89</div>
                    <div className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400">takip</div>
                </div>
            </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-0.5">
            <h3 className="text-sm font-bold dark:text-white">{user.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">DreamWorks</p>
            <p className="text-sm dark:text-gray-200 leading-snug whitespace-pre-line">{user.bio || "Annabella gelini ✨"}</p>
            {user.weddingDate && (
                <div className="text-xs text-wedding-600 font-medium flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
                    Düğün: {new Date(user.weddingDate).toLocaleDateString('tr-TR')}
                </div>
            )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2">
            <button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Profili düzenle</button>
            <button className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Profili paylaş</button>
            <button className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg transition-colors">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
            </button>
        </div>

        {/* DROPDOWN SETTINGS (MOBILE STYLE) */}
        {showSettings && (
            <div className="fixed inset-0 bg-black/50 z-[1100] flex items-end animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
                <div className="w-full bg-white dark:bg-gray-900 rounded-t-2xl p-4 space-y-2 animate-in slide-in-from-bottom-5 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="w-10 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-4 text-sm font-bold text-red-500 flex items-center gap-3 border-b dark:border-gray-800">
                        Çıkış Yap
                    </button>
                    <button onClick={onDeleteAccount} className="w-full text-left px-4 py-4 text-sm font-bold text-gray-400 flex items-center gap-3">
                        Hesabı Sil
                    </button>
                    <button onClick={() => setShowSettings(false)} className="w-full text-center py-4 text-sm font-bold text-gray-900 dark:text-white">İptal</button>
                </div>
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-t dark:border-gray-800">
        <button 
            onClick={() => setActiveTab('grid')}
            className={`flex-1 flex items-center justify-center py-3 border-t-2 transition-colors ${activeTab === 'grid' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400'}`}
        >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>
        </button>
        <button 
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center py-3 border-t-2 transition-colors ${activeTab === 'saved' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400'}`}
        >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6"><path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-3 gap-0.5 md:gap-1.5 mt-0.5">
        {userPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-900">
            <img src={post.media[0].url} alt="Post" onClick={() => onPostClick(post)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                <span className="flex items-center gap-1"><svg fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>{post.likes}</span>
                <span className="flex items-center gap-1"><svg fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>{post.comments.length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-theme-dark rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 animate-in zoom-in-95 duration-300 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif font-bold dark:text-white">Profilini Düzenle</h3>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <img src={editAvatar} className="w-24 h-24 rounded-full object-cover border border-wedding-200 p-0.5" alt="Edit avatar" />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold">Değiştir</div>
                        </div>
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest mb-2 block">Ad Soyad</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-5 py-3.5 text-sm dark:text-white outline-none" placeholder="Adınız Soyadınız" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest mb-2 block">Biyografi</label>
                        <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Biraz kendinden bahset..." className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-5 py-3.5 text-sm dark:text-white outline-none h-24 resize-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-widest mb-2 block">Düğün Tarihi</label>
                        <input type="date" value={editWeddingDate} onChange={(e) => setEditWeddingDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-5 py-3.5 text-sm dark:text-white outline-none" />
                    </div>
                </div>
                <div className="flex flex-col gap-3 mt-10">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-2xl shadow-none">Değişiklikleri Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest">Vazgeç</button>
                </div>
            </div>
        </div>
      )}

      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Emin misin?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
