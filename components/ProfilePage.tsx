
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
  onFollowToggle
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
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
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

  // Modalı açtığımızda kullanıcı detaylarını getir
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
                console.error("Takip listesi yüklenemedi:", e);
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

  if (!user) {
      return (
          <div className="max-w-md mx-auto px-6 py-20 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-zinc-800 shadow-inner">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2 text-center uppercase tracking-widest">Profiline Eriş</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-10 leading-relaxed italic text-center">
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
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-4 md:gap-14">
            <div className="shrink-0">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-lg p-[1.5px] border border-wedding-500/20 overflow-hidden shadow-sm">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-md object-cover" />
                </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg md:text-2xl font-bold dark:text-white tracking-tight truncate">{user.name}</h2>
                    <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-wedding-500 transition-colors">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                    </button>
                </div>

                <div className="flex gap-3.5 md:gap-6 overflow-x-auto no-scrollbar">
                    <div className="flex flex-col md:flex-row md:items-center">
                        <span className="text-sm font-bold dark:text-white leading-none">{userPosts.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold md:ml-1 mt-0.5 md:mt-0">Gönderi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsFollowModalOpen('followers')}>
                        <span className="text-sm font-bold dark:text-white leading-none">{followData.followers.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold md:ml-1 mt-0.5 md:mt-0">Takipçi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsFollowModalOpen('following')}>
                        <span className="text-sm font-bold dark:text-white leading-none">{followData.following.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold md:ml-1 mt-0.5 md:mt-0">Takip</span>
                    </div>
                </div>
                
                <p className="hidden md:block text-[12px] dark:text-gray-400 leading-snug font-light italic mt-1">
                    {user.bio || "Hayalindeki gelinliği Annabella'da buldu ✨"}
                </p>
            </div>
        </div>

        {/* 3 EQUAL STROKE BUTTONS */}
        <div className="flex gap-2">
            <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-wedding-500 hover:text-wedding-500 text-gray-500 dark:text-gray-400 text-[10px] font-bold py-2.5 rounded-md transition-all uppercase tracking-[0.1em]"
            >
                Düzenle
            </button>
            
            <button 
                onClick={() => setActiveTab(activeTab === 'posts' ? 'liked' : 'posts')}
                className={`flex-1 bg-transparent border ${activeTab === 'liked' ? 'border-wedding-500 text-wedding-500' : 'border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400'} hover:border-wedding-500 hover:text-wedding-500 text-[10px] font-bold py-2.5 rounded-md transition-all uppercase tracking-[0.1em]`}
            >
                {activeTab === 'posts' ? 'Beğeniler' : 'Gönderiler'}
            </button>

            <a 
                href="https://annabellabridal.com" 
                target="_blank"
                className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-wedding-500 hover:text-wedding-500 text-gray-500 dark:text-gray-400 text-[10px] font-bold py-2.5 rounded-md transition-all uppercase tracking-[0.1em] text-center"
            >
                Mağaza
            </a>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-1">
        {displayPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900 shadow-inner">
            <img 
                src={post.media[0].url} 
                alt="Post" 
                onClick={() => setSelectedPost(post)} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            {activeTab === 'posts' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setPostToDelete(post.id); }}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
            {activeTab === 'liked' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-wedding-500 z-10"
                    title="Beğeniyi Kaldır"
                >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                </button>
            )}
          </div>
        ))}
        {displayPosts.length === 0 && (
            <div className="col-span-3 py-24 text-center opacity-30 italic font-serif text-sm">
                Henüz gösterilecek bir şey yok.
            </div>
        )}
      </div>

      {/* SINGLE POST DETAIL MODAL */}
      {selectedPost && (
          <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-[160] transition-colors">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-theme-black rounded-lg shadow-2xl animate-in slide-in-from-bottom-5">
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

      {/* FOLLOWERS / FOLLOWING LIST MODAL */}
      {isFollowModalOpen && (
          <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[70vh]">
                  <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                      <h3 className="font-serif font-bold dark:text-white text-sm uppercase tracking-widest">
                          {isFollowModalOpen === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                      </h3>
                      <button onClick={() => setIsFollowModalOpen(null)} className="text-gray-400 hover:text-wedding-500 p-1 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                      {isFollowListLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-30">
                              <div className="w-6 h-6 border-2 border-wedding-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Hazırlanıyor...</span>
                          </div>
                      ) : followListUsers.length > 0 ? (
                          followListUsers.map(listUser => (
                              <div key={listUser.id} className="flex items-center justify-between animate-fadeIn bg-gray-50/30 dark:bg-zinc-900/30 p-2 rounded-md border border-gray-100 dark:border-zinc-800/50">
                                  <div className="flex items-center gap-3">
                                      <img src={listUser.avatar} className="w-9 h-9 rounded-md object-cover border border-gray-100 dark:border-zinc-800" alt={listUser.name} />
                                      <div className="flex flex-col">
                                          <span className="text-[12px] font-bold dark:text-white leading-tight">{listUser.name}</span>
                                          <span className="text-[9px] text-gray-400 truncate max-w-[120px] italic">{listUser.bio || "Gelin adayı ✨"}</span>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => onFollowToggle(listUser.id)}
                                    className={`text-[9px] font-bold px-3 py-1.5 rounded-md border transition-all uppercase tracking-widest ${followingIds.includes(listUser.id) ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400' : 'bg-wedding-500 border-wedding-500 text-white'}`}
                                  >
                                      {followingIds.includes(listUser.id) ? 'Bırak' : 'Takip'}
                                  </button>
                              </div>
                          ))
                      ) : (
                          <div className="py-20 text-center opacity-30 italic font-serif text-xs">Henüz bir veri yok.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* SETTINGS SHEET */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-[1100] flex items-end animate-in fade-in" onClick={() => setShowSettings(false)}>
              <div className="w-full bg-white dark:bg-[#121212] rounded-t-xl p-6 pb-12 space-y-2.5" onClick={e => e.stopPropagation()}>
                  <button onClick={onLogout} className="w-full text-center py-4 text-xs font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50 uppercase tracking-[0.2em]">Oturumu Kapat</button>
                  <button onClick={() => { setShowSettings(false); onDeleteAccount(); }} className="w-full text-center py-4 text-xs font-bold text-red-500 border border-red-100 dark:border-red-900/10 bg-red-50 dark:bg-red-900/10 rounded-lg uppercase tracking-[0.2em]">Hesabı Sil</button>
                  <button onClick={() => setShowSettings(false)} className="w-full text-center py-3 text-[10px] text-gray-400 uppercase tracking-widest mt-2">İptal</button>
              </div>
          </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-theme-dark rounded-xl w-full max-w-sm p-8 animate-in zoom-in-95 relative shadow-2xl">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center mb-6">
                    <h3 className="text-lg font-serif font-bold dark:text-white uppercase tracking-widest">Profili Düzenle</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-lg border-2 border-wedding-500/30 p-1 group cursor-pointer overflow-hidden"
                        >
                            <img src={editAvatar} className="w-full h-full rounded-md object-cover transition-transform group-hover:scale-105" alt="edit-avatar" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">DEĞİŞTİR</div>
                        </div>
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Ad Soyad</label>
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-md px-4 py-2.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-colors" placeholder="Ad Soyad" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Biyografi</label>
                            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-md px-4 py-3 text-sm dark:text-white outline-none h-24 resize-none focus:border-wedding-500 transition-colors font-light italic" placeholder="Hayallerini anlat..." />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-2">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-md shadow-none">Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] hover:text-red-500 transition-colors text-center">İptal</button>
                </div>
            </div>
        </div>
      )}
      <ConfirmationModal isOpen={!!postToDelete} title="Fotoğrafı Sil" message="Emin misiniz?" onConfirm={async () => { if(postToDelete) { await onDeletePost(postToDelete); setPostToDelete(null); } }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};
