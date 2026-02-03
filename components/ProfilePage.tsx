
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
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 flex items-center justify-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
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
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.797.939a4.109 4.109 0 01.583.287c.396.226.86.213 1.248-.035l.794-.507c.468-.299 1.085-.203 1.446.223l.772.919c.36.429.313 1.066-.106 1.44l-.718.638c-.322.287-.442.736-.312 1.144a4.103 4.103 0 010 .572c-.13.408-.01.857.312 1.144l.718.638c.419.374.467 1.011.106 1.44l-.772.919c-.361.426-.978.522-1.446.223l-.794-.507c-.388-.248-.852-.261-1.248-.035a4.112 4.112 0 01-.583.287c-.413.175-.727.515-.797.939l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.797-.939a4.109 4.109 0 01-.583.287c-.396-.226-.86-.213-1.248.035l-.794.507c-.468.299-1.085.203-1.446-.223l-.772-.919c-.36-.429-.313-1.066.106-1.44l.718-.638c.322-.287.442-.736.312-1.144a4.103 4.103 0 010-.572c.13-.408.01-.857-.312-1.144l-.718-.638c-.419-.374-.467-1.011-.106-1.44l.772-.919c.361-.426.978-.522 1.446-.223l.794.507c.388.248.852.261 1.248.035.397-.226.812-.132 1.248-.287.413-.175.727-.515.797-.939l.149-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>

        {showSettings && (
            <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 py-2 w-48 z-20 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => { setIsEditModalOpen(true); setShowSettings(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Profili Düzenle</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Çıkış Yap</button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
                <button onClick={() => { onDeleteAccount(); setShowSettings(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">Hesabı Sil</button>
            </div>
        )}

        <div className="relative group">
          <img src={user.avatar} alt={user.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-wedding-200 p-1 shadow-sm" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
            <h1 className="text-2xl font-serif font-bold dark:text-white">{user.name}</h1>
            <button onClick={() => setIsEditModalOpen(true)} className="text-[10px] px-3 py-1.5 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-full font-bold hover:bg-wedding-50 transition-colors">Profili Düzenle</button>
          </div>
          
          <div className="flex justify-center md:justify-start gap-6 mb-4">
            <div className="text-xs text-gray-500"><span className="font-bold dark:text-white">{userPosts.length}</span> gönderi</div>
            {user.weddingDate && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-wedding-500" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" /></svg>
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
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl">
            <img src={post.media[0].url} alt="Post" onClick={() => onPostClick(post)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <button onClick={() => setPostToDelete(post.id)} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-serif font-bold mb-6 dark:text-white">Profili Düzenle</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Ad Soyad</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-wedding-500" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Biyografi</label>
                        <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Biraz kendinden bahset..." className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-wedding-500 h-24 resize-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Düğün Tarihi (Opsiyonel)</label>
                        <input type="date" value={editWeddingDate} onChange={(e) => setEditWeddingDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-wedding-500" />
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="flex-1">İptal</Button>
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="flex-1">Kaydet</Button>
                </div>
            </div>
        </div>
      )}

      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Bu fotoğrafı silmek istediğine emin misin?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
