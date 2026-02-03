
import React, { useState } from 'react';
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
  
  // Edit States
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editWeddingDate, setEditWeddingDate] = useState(user?.weddingDate || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        onLogout();
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        await dbService.updateUser(user.id, {
            name: editName,
            bio: editBio,
            weddingDate: editWeddingDate
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-xl font-serif font-bold dark:text-white">Henüz bir profilin yok</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">İçerikleri yönetmek için giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 border-b border-gray-100 dark:border-gray-800 pb-12 relative">
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-wedding-500 transition-colors z-10"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
        </button>

        {showSettings && (
            <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 py-2 w-52 z-[110] animate-in fade-in slide-in-from-top-2">
                <button onClick={() => { setIsEditModalOpen(true); setShowSettings(false); }} className="w-full text-left px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-wedding-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Profili Düzenle
                </button>
                <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-wedding-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Çıkış Yap
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-3"></div>
                <button onClick={() => { onDeleteAccount(); setShowSettings(false); }} className="w-full text-left px-5 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Hesabı Sil
                </button>
            </div>
        )}

        <div className="relative group">
          <img src={user.avatar} alt={user.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border border-wedding-200 p-0.5 shadow-sm" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
            <h1 className="text-2xl font-serif font-bold dark:text-white">{user.name}</h1>
            <button onClick={() => setIsEditModalOpen(true)} className="text-[10px] px-4 py-1.5 border border-gray-200 dark:border-gray-800 dark:text-gray-300 rounded-full font-bold hover:bg-wedding-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-widest">Profili Düzenle</button>
          </div>
          
          <div className="flex justify-center md:justify-start gap-6 mb-4">
            <div className="text-xs text-gray-500"><span className="font-bold dark:text-white">{userPosts.length}</span> gönderi</div>
            {user.weddingDate && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-wedding-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
                    {new Date(user.weddingDate).toLocaleDateString('tr-TR')}
                </div>
            )}
          </div>
          
          <p className="text-sm dark:text-gray-300 italic font-serif max-w-md">
            {user.bio || "Annabella gelini ✨"}
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {userPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-gray-50 dark:bg-gray-900">
            <img src={post.media[0].url} alt="Post" onClick={() => onPostClick(post)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <button onClick={() => setPostToDelete(post.id)} className="absolute top-2 right-2 bg-black/40 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Profile Modal - FIXED Z-INDEX & DESIGN */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-theme-dark rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 animate-in zoom-in-95 duration-300 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif font-bold dark:text-white">Profilini Düzenle</h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Kişisel Bilgiler</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-[0.2em] mb-2 block">Ad Soyad</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-5 py-3.5 text-sm dark:text-white outline-none focus:ring-1 focus:ring-wedding-500 transition-all font-medium" placeholder="Adınız Soyadınız" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-[0.2em] mb-2 block">Biyografi</label>
                        <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Biraz kendinden bahset..." className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-5 py-3.5 text-sm dark:text-white outline-none focus:ring-1 focus:ring-wedding-500 h-28 resize-none font-medium leading-relaxed" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-wedding-500 uppercase tracking-[0.2em] mb-2 block">Düğün Tarihi</label>
                        <input type="date" value={editWeddingDate} onChange={(e) => setEditWeddingDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-5 py-3.5 text-sm dark:text-white outline-none focus:ring-1 focus:ring-wedding-500 font-medium" />
                    </div>
                </div>
                <div className="flex flex-col gap-3 mt-10">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-2xl shadow-none">Değişiklikleri Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest">Vazgeç</button>
                </div>
            </div>
        </div>
      )}

      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Bu fotoğrafı silmek istediğine emin misin?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
