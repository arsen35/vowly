
import React, { useState, useRef, useEffect } from 'react';
import { Post, User } from '../types';
import { dbService } from '../services/db';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';
import { AuthModalContent } from './AuthModal';
import { PostCard } from './PostCard';
import { Logo } from './Logo';

interface ProfilePageProps {
  user: User | null;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
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
  isAdmin,
  onOpenAdmin,
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
  const [isDeleteAccConfirmOpen, setIsDeleteAccConfirmOpen] = useState(false);
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
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditUsername(user.username || '');
      setEditBio(user.bio || '');
      setEditAvatar(user.avatar);
      
      const unsubscribe = dbService.subscribeToFollowData(user.id, (data) => {
        setFollowData(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

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
          <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] px-6 animate-fadeIn">
              <div className="w-full max-w-sm flex flex-col items-center text-center">
                  <Logo className="h-20 w-auto mb-12" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10 uppercase tracking-[0.2em]">Topluluğa Katıl</h2>
                  <AuthModalContent onLoginSuccess={onLoginSuccess} />
              </div>
          </div>
      );
  }

  const userPosts = posts.filter(p => p.user.id === user?.id);
  const likedPosts = posts.filter(p => p.isLikedByCurrentUser);
  const displayPosts = activeTab === 'posts' ? userPosts : likedPosts;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-14 pb-32 animate-fadeIn relative">
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex items-center gap-6 md:gap-12 relative">
            <div className="shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg p-1 border border-gray-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                    <img src={user.avatar} className="w-full h-full rounded-md object-cover" alt={user.name} />
                </div>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white tracking-tight truncate">{user.name}</h2>
                        <p className="text-[11px] text-gray-400 font-bold">@{user.username || 'user'}</p>
                    </div>
                    
                    <div className="relative" ref={settingsRef}>
                        <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md transition-all active:scale-90">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                        </button>
                        
                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {isAdmin && (
                                    <button onClick={() => { onOpenAdmin?.(); setShowSettings(false); }} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Yönetici Paneli</button>
                                )}
                                <button onClick={() => { setIsEditModalOpen(true); setShowSettings(false); }} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Profili Düzenle</button>
                                <button onClick={() => { onInstallApp(); setShowSettings(false); }} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Uygulamayı Yükle</button>
                                <div className="h-px bg-gray-100 dark:bg-zinc-900 mx-2"></div>
                                <button onClick={() => { onLogout(); setShowSettings(false); }} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Çıkış Yap</button>
                                <button onClick={() => { setIsDeleteAccConfirmOpen(true); setShowSettings(false); }} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Hesabı Sil</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-6 items-center mt-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-1.5">
                        <span className="text-sm font-bold leading-none dark:text-white">{userPosts.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Paylaşım</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-1.5 cursor-pointer group" onClick={() => setIsFollowModalOpen('followers')}>
                        <span className="text-sm font-bold leading-none dark:text-white group-hover:text-wedding-500 transition-colors">{followData.followers.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-wedding-500 transition-colors">Takipçi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-1.5 cursor-pointer group" onClick={() => setIsFollowModalOpen('following')}>
                        <span className="text-sm font-bold leading-none dark:text-white group-hover:text-wedding-500 transition-colors">{followData.following.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-wedding-500 transition-colors">Takip</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 font-normal line-clamp-2 leading-relaxed">{user.bio || "Hikayesini paylaşıyor ✨"}</p>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
            <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-gray-300 text-[9px] font-bold py-3 rounded-md uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-95"
            >
                Düzenle
            </button>
            <button 
                onClick={() => setActiveTab('posts')} 
                className={`border transition-all text-[9px] font-bold py-3 rounded-md uppercase tracking-widest active:scale-95 ${activeTab === 'posts' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
                Paylaşımlar
            </button>
            <button 
                onClick={() => setActiveTab('liked')} 
                className={`border transition-all text-[9px] font-bold py-3 rounded-md uppercase tracking-widest active:scale-95 ${activeTab === 'liked' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
                Beğeniler
            </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {displayPosts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post)} 
            className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900 rounded-md shadow-sm border border-gray-100 dark:border-zinc-800"
          >
            <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="post" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="flex items-center gap-3 text-white">
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                        {post.likes}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                        {post.comments.length}
                    </div>
                </div>
            </div>
          </div>
        ))}
        {displayPosts.length === 0 && (
            <div className="col-span-3 py-24 text-center">
                <p className="text-gray-400 font-normal text-sm">Burada henüz bir içerik yok ✨</p>
            </div>
        )}
      </div>

      {selectedPost && (
          <div className="fixed inset-0 z-[1000] bg-white dark:bg-theme-black overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              <div className="sticky top-0 left-0 right-0 h-14 bg-white/90 dark:bg-theme-black/90 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between px-6 z-10">
                  <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group">
                      <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Kapat</span>
                  </button>
                  <span className="text-[10px] font-bold dark:text-white uppercase tracking-[0.2em] truncate max-w-[150px]">{selectedPost.user.name}</span>
                  <div className="w-10"></div>
              </div>
              
              <div className="w-full max-w-lg mx-auto py-8 px-4 pb-20">
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

      {isFollowModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-zinc-950 rounded-lg w-full max-w-xs md:max-w-sm max-h-[70vh] flex flex-col shadow-2xl border border-gray-100 dark:border-zinc-900 overflow-hidden">
                  <div className="p-4 border-b dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-zinc-950">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {isFollowModalOpen === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                      </h3>
                      <button onClick={() => setIsFollowModalOpen(null)} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {isFollowListLoading ? (
                          <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-wedding-500 border-t-transparent rounded-full animate-spin"></div></div>
                      ) : (
                          <div className="space-y-1">
                              {followListUsers.map(listUser => (
                                  <div key={listUser.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <img src={listUser.avatar} className="w-9 h-9 rounded-md object-cover border border-gray-100 dark:border-zinc-800" />
                                          <div className="flex flex-col">
                                              <span className="text-xs font-bold dark:text-white leading-tight">{listUser.name}</span>
                                              <span className="text-[9px] text-gray-400 font-medium">@{listUser.username}</span>
                                          </div>
                                      </div>
                                      {listUser.id !== user.id && (
                                          <button 
                                              onClick={() => onFollowToggle(listUser.id)}
                                              className={`text-[8px] font-bold px-3 py-1.5 rounded-md border transition-all uppercase tracking-wider ${followingIds.includes(listUser.id) ? 'border-gray-100 dark:border-zinc-800 text-gray-400' : 'border-wedding-500 text-wedding-500 hover:bg-wedding-500 hover:text-white'}`}
                                          >
                                              {followingIds.includes(listUser.id) ? 'Takip' : 'Takip Et'}
                                          </button>
                                      )}
                                  </div>
                              ))}
                              {followListUsers.length === 0 && (
                                  <div className="py-12 text-center text-[10px] text-gray-400 font-normal">Henüz kimse yok ✨</div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-950 rounded-lg w-full max-w-sm p-8 animate-in zoom-in-95 relative shadow-2xl border border-gray-100 dark:border-zinc-900">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-lg font-bold dark:text-white uppercase tracking-widest mb-8 text-center">Profili Güncelle</h3>
                
                <div className="space-y-5">
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-lg border border-gray-100 dark:border-zinc-800 p-1 group cursor-pointer overflow-hidden shadow-sm"
                        >
                            <img src={editAvatar} className="w-full h-full rounded-md object-cover" alt="avatar" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold tracking-widest">DEĞİŞTİR</div>
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
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Görünen İsim</label>
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-transparent border border-gray-100 dark:border-zinc-900 rounded-md px-3 py-2.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-all" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kullanıcı Adı (@)</label>
                            <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-transparent border border-gray-100 dark:border-zinc-900 rounded-md px-3 py-2.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-all" placeholder="kullanici_adi" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Biyografi / Hakkımda</label>
                            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-transparent border border-gray-100 dark:border-zinc-900 rounded-md px-3 py-2.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-all h-20 resize-none font-normal" placeholder="Kendinden bahset..." />
                        </div>
                        {usernameError && <p className="text-[9px] text-red-500 font-bold px-1">{usernameError}</p>}
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-2">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-3.5 rounded-md text-[10px] uppercase tracking-widest border border-wedding-500 shadow-none">Değişiklikleri Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-2.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center hover:text-gray-600 transition-all">İptal</button>
                </div>
            </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={isDeleteAccConfirmOpen}
        title="Hesabını Sil"
        message="Hesabını ve tüm paylaşımlarını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz."
        onConfirm={() => { onDeleteAccount(); setIsDeleteAccConfirmOpen(false); }}
        onCancel={() => setIsDeleteAccConfirmOpen(false)}
      />
    </div>
  );
};
