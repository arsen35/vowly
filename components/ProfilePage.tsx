
import React, { useState, useRef } from 'react';
import { Post, User } from '../types';
import { dbService } from '../services/db';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';
import { AuthModalContent } from './AuthModal'; // Burayı AuthModal içinden ayırdığımızı varsayalım veya inline yazalım

interface ProfilePageProps {
  user: User | null;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onDeletePost: (postId: string) => void;
  onLoginSuccess: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  posts, 
  onPostClick, 
  onLogout, 
  onDeleteAccount,
  onDeletePost,
  onLoginSuccess
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

  // Misafir Kullanıcı İçin Giriş Ekranı
  if (!user) {
      return (
          <div className="max-w-md mx-auto px-6 py-20 text-center animate-fadeIn">
              <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-zinc-800">
                  <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-3">Profiline Eriş</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 leading-relaxed italic">
                  Annabella topluluğuna katılmak, anılarını paylaşmak ve favorilerini kaydetmek için giriş yap.
              </p>
              
              <div className="space-y-4">
                  <AuthModalContent onLoginSuccess={onLoginSuccess} />
              </div>
          </div>
      );
  }

  const userPosts = posts.filter(p => p.user.id === user?.id);
  const likedPosts = posts.filter(p => p.isLikedByCurrentUser);
  const displayPosts = activeTab === 'posts' ? userPosts : likedPosts;

  const handleSaveProfile = async () => {
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
                    <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-wedding-500 transition-colors">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                    </button>
                </div>

                <div className="flex gap-8">
                    <div>
                        <span className="text-sm font-bold dark:text-white">{userPosts.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1.5">Gönderi</span>
                    </div>
                    <div>
                        <span className="text-sm font-bold dark:text-white">{likedPosts.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1.5">Beğeni</span>
                    </div>
                </div>
                
                <p className="hidden md:block text-sm dark:text-gray-400 leading-snug font-light italic">
                    {user.bio || "Hayalindeki gelinliği Annabella'da buldu ✨"}
                </p>
            </div>
        </div>

        {/* 3 EQUAL STROKE BUTTONS */}
        <div className="flex gap-3">
            <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-wedding-500 hover:text-wedding-500 text-gray-500 dark:text-gray-400 text-[10px] font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.1em]"
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
                className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-wedding-500 hover:text-wedding-500 text-gray-500 dark:text-gray-400 text-[10px] font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.1em] text-center"
            >
                Website
            </a>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-1">
        {displayPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900">
            <img src={post.media[0].url} alt="Post" onClick={() => onPostClick(post)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {activeTab === 'posts' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setPostToDelete(post.id); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
          </div>
        ))}
        {displayPosts.length === 0 && (
            <div className="col-span-3 py-24 text-center opacity-30 italic font-serif">
                Henüz gösterilecek bir şey yok.
            </div>
        )}
      </div>

      {/* SETTINGS SHEET */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-[1100] flex items-end animate-in fade-in" onClick={() => setShowSettings(false)}>
              <div className="w-full bg-white dark:bg-[#121212] rounded-t-3xl p-6 pb-12 space-y-3" onClick={e => e.stopPropagation()}>
                  <button onClick={onLogout} className="w-full text-center py-4 text-xs font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 uppercase tracking-[0.2em]">Oturumu Kapat</button>
                  <button onClick={() => { setShowSettings(false); onDeleteAccount(); }} className="w-full text-center py-4 text-xs font-bold text-red-500 border border-red-100 dark:border-red-900/10 bg-red-50 dark:bg-red-900/10 rounded-2xl uppercase tracking-[0.2em]">Hesabı Sil</button>
                  <button onClick={() => setShowSettings(false)} className="w-full text-center py-4 text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Vazgeç</button>
              </div>
          </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-theme-dark rounded-[32px] w-full max-w-sm p-8 animate-in zoom-in-95 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                <div className="text-center mb-8"><h3 className="text-xl font-serif font-bold dark:text-white">Profili Düzenle</h3></div>
                <div className="space-y-4">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none border border-gray-100 dark:border-zinc-800" placeholder="Ad Soyad" />
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none h-24 border border-gray-100 dark:border-zinc-800 resize-none" placeholder="Biyografi" />
                </div>
                <div className="mt-8">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-xl">Kaydet</Button>
                </div>
            </div>
        </div>
      )}
      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Emin misiniz?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
