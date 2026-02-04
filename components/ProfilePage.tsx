
import React, { useState, useRef, useEffect } from 'react';
import { Post, User } from '../types';
import { dbService } from '../services/db';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';
import { AuthModalContent } from './AuthModal';
import { PostCard } from './PostCard';

interface ProfilePageProps {
  user: User | null;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onDeletePost: (postId: string) => void;
  onLoginSuccess: () => void;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  followingIds: string[];
  onFollowToggle: (userId: string) => void;
  onInstallApp: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  posts, 
  onLogout, 
  onDeleteAccount,
  onDeletePost,
  onLoginSuccess,
  onLike,
  onAddComment,
  followingIds,
  onFollowToggle,
  onInstallApp
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [followData, setFollowData] = useState<{ followers: string[], following: string[] }>({ followers: [], following: [] });
  const [isFollowModalOpen, setIsFollowModalOpen] = useState<'followers' | 'following' | null>(null);
  const [followListUsers, setFollowListUsers] = useState<User[]>([]);
  const [isFollowListLoading, setIsFollowListLoading] = useState(false);
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [usernameError, setUsernameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = dbService.subscribeToFollowData(user.id, (data) => {
        setFollowData(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (isFollowModalOpen) {
        const loadUsers = async () => {
            const ids = isFollowModalOpen === 'followers' ? followData.followers : followData.following;
            if (!ids || ids.length === 0) {
                setFollowListUsers([]);
                return;
            }
            setIsFollowListLoading(true);
            try {
                const users = await dbService.getUsersByIds(ids);
                setFollowListUsers(users);
            } catch (e) {
                setFollowListUsers([]);
            } finally {
                setIsFollowListLoading(false);
            }
        };
        loadUsers();
    } else {
        setFollowListUsers([]);
    }
  }, [isFollowModalOpen, followData]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setUsernameError('');
    
    const cleanUsername = editUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
        setUsernameError('Kullanıcı adı en az 3 karakter olmalı.');
        setIsSaving(false);
        return;
    }

    const isUnique = await dbService.checkUsernameUnique(cleanUsername, user.id);
    if (!isUnique) {
        setUsernameError('Bu kullanıcı adı maalesef alınmış.');
        setIsSaving(false);
        return;
    }

    try {
        await dbService.updateUser(user.id, {
            name: editName,
            username: cleanUsername,
            bio: editBio,
            avatar: editAvatar
        });
        setIsEditModalOpen(false);
    } catch (e) {
        alert("Güncellenirken bir hata oluştu.");
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) {
      return (
          <div className="max-w-md mx-auto px-6 py-20 text-center animate-fadeIn">
              <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-gray-100 dark:border-zinc-800 shadow-inner">
                  <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest">Aramıza Katıl</h2>
              <p className="text-xs text-gray-500 mb-10 italic">Profilini oluşturmak ve gelinlik anılarını paylaşmak için giriş yap.</p>
              <AuthModalContent onLoginSuccess={onLoginSuccess} />
          </div>
      );
  }

  const userPosts = posts.filter(p => p.user.id === user?.id);
  const likedPosts = posts.filter(p => p.isLikedByCurrentUser);
  const displayPosts = activeTab === 'posts' ? userPosts : likedPosts;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 md:pt-16 pb-32 animate-fadeIn">
      {/* PROFILE HEADER */}
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex items-center gap-6 md:gap-16">
            <div className="shrink-0 relative">
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-[2.5rem] p-1.5 border-2 border-wedding-500/20 overflow-hidden shadow-2xl transition-transform hover:scale-105 duration-500">
                    <img src={user.avatar} className="w-full h-full rounded-[2rem] object-cover" alt={user.name} />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-wedding-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white dark:border-theme-black">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-serif text-2xl md:text-4xl font-bold dark:text-white tracking-tight truncate">{user.name}</h2>
                        <p className="text-[13px] text-wedding-500 font-bold italic mt-1">@{user.username || 'annabella_gelini'}</p>
                    </div>
                    <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-wedding-500 hover:bg-wedding-50 dark:hover:bg-wedding-900/10 rounded-2xl transition-all">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                    </button>
                </div>

                <div className="flex gap-6 md:gap-12 items-center">
                    <div className="flex flex-col md:flex-row md:items-center gap-1">
                        <span className="text-lg font-black dark:text-white leading-none">{userPosts.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Paylaşım</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 cursor-pointer group" onClick={() => setIsFollowModalOpen('followers')}>
                        <span className="text-lg font-black dark:text-white leading-none group-hover:text-wedding-500 transition-colors">{followData.followers.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Takipçi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 cursor-pointer group" onClick={() => setIsFollowModalOpen('following')}>
                        <span className="text-lg font-black dark:text-white leading-none group-hover:text-wedding-500 transition-colors">{followData.following.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Takip</span>
                    </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-serif italic leading-relaxed line-clamp-2 md:line-clamp-none">
                    {user.bio || "Hayalindeki gelinliği Annabella'da buldu. Bu mutlu yolculuğun bir parçası olmak harika ✨"}
                </p>
            </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
            <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-200 text-[11px] font-bold py-3.5 rounded-2xl shadow-sm hover:border-wedding-500 hover:text-wedding-500 transition-all uppercase tracking-widest"
            >
                Profili Düzenle
            </button>
            <button 
                onClick={() => setActiveTab(activeTab === 'posts' ? 'liked' : 'posts')} 
                className={`flex-1 flex items-center justify-center gap-2 border ${activeTab === 'liked' ? 'bg-wedding-500 border-wedding-500 text-white' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-200'} text-[11px] font-bold py-3.5 rounded-2xl shadow-sm transition-all uppercase tracking-widest`}
            >
                <svg className="w-4 h-4" fill={activeTab === 'liked' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {activeTab === 'posts' ? 'Beğeniler' : 'Paylaşımlar'}
            </button>
            <a 
                href="https://annabellabridal.com" 
                target="_blank" 
                className="hidden md:flex flex-1 items-center justify-center gap-2 bg-wedding-50 dark:bg-wedding-900/10 border border-wedding-500/20 text-wedding-900 dark:text-wedding-200 text-[11px] font-bold py-3.5 rounded-2xl uppercase tracking-widest hover:bg-wedding-500 hover:text-white transition-all"
            >
                Mağaza &rarr;
            </a>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {displayPosts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900 rounded-xl md:rounded-3xl shadow-sm"
          >
            <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="post" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="flex items-center gap-4 text-white">
                    <div className="flex items-center gap-1 font-bold">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                        {post.likes}
                    </div>
                    <div className="flex items-center gap-1 font-bold">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" /></svg>
                        {post.comments.length}
                    </div>
                </div>
            </div>
          </div>
        ))}
        {displayPosts.length === 0 && (
            <div className="col-span-3 py-32 text-center">
                <p className="text-gray-400 italic font-serif text-lg">Bu sekmede henüz bir içerik yok ✨</p>
            </div>
        )}
      </div>

      {/* MODALS */}
      {selectedPost && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
              <button onClick={() => setSelectedPost(null)} className="fixed top-8 right-8 text-white/50 hover:text-white p-2 z-[110] transition-colors">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="w-full max-w-sm md:max-w-md my-auto animate-in slide-in-from-bottom-8 duration-500">
                  <PostCard 
                    post={selectedPost} 
                    onLike={onLike} 
                    onAddComment={onAddComment} 
                    onDelete={onDeletePost} 
                    isAdmin={user.id === selectedPost.user.id} 
                    isFollowing={followingIds.includes(selectedPost.user.id)}
                    onFollow={() => onFollowToggle(selectedPost.user.id)}
                    currentUserId={user.id}
                  />
              </div>
          </div>
      )}

      {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in" onClick={() => setShowSettings(false)}>
              <div className="w-full bg-white dark:bg-zinc-900 rounded-t-[3rem] p-8 pb-14 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6"></div>
                  <button onClick={onInstallApp} className="w-full text-center py-5 text-xs font-bold text-wedding-500 border-2 border-wedding-500/10 rounded-3xl bg-wedding-50/50 dark:bg-wedding-900/10 uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Uygulamayı Ana Ekrana Ekle
                  </button>
                  <button onClick={onLogout} className="w-full text-center py-5 text-xs font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800 rounded-3xl bg-gray-50 dark:bg-zinc-800/50 uppercase tracking-[0.2em] active:scale-95 transition-all">Oturumu Kapat</button>
                  <button onClick={() => setShowSettings(false)} className="w-full text-center py-4 text-[11px] text-gray-400 uppercase tracking-widest font-bold">Vazgeç</button>
              </div>
          </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-zinc-950 rounded-[3rem] w-full max-w-sm p-10 animate-in zoom-in-95 relative shadow-2xl border border-gray-100 dark:border-zinc-900">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-wedding-500 p-2 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-2xl font-serif font-bold dark:text-white uppercase tracking-widest mb-10 text-center">Profili Güncelle</h3>
                
                <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="relative w-28 h-28 rounded-[2.5rem] border-4 border-wedding-500/10 p-1.5 group cursor-pointer overflow-hidden shadow-xl"
                        >
                            <img src={editAvatar} className="w-full h-full rounded-[2rem] object-cover" alt="edit-avatar" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold tracking-widest">DEĞİŞTİR</div>
                        </div>
                        <input type="file" ref={avatarInputRef} onChange={async (e) => {
                           if (e.target.files?.[0]) {
                             const reader = new FileReader();
                             reader.readAsDataURL(e.target.files[0]);
                             reader.onload = (ev) => setEditAvatar(ev.target?.result as string);
                           }
                        }} accept="image/*" className="hidden" />
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Görünen İsim</label>
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-transparent text-sm dark:text-white outline-none font-bold" />
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kullanıcı Adı (@)</label>
                            <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-transparent text-sm text-wedding-500 outline-none font-bold" placeholder="sadece_harfler" />
                        </div>
                        {usernameError && <p className="text-[10px] text-red-500 font-bold px-4">{usernameError}</p>}
                        <div className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hayallerini Anlat</label>
                            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-transparent text-sm dark:text-white outline-none h-20 resize-none font-serif italic" />
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-5 rounded-[2rem] shadow-xl text-xs uppercase tracking-[0.2em]">Değişiklikleri Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">İptal</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
