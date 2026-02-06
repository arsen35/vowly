
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
  isPublicProfile?: boolean;
  currentUser?: User | null;
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
  onUserClick?: (user: User) => void;
  onMessageClick?: (user: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  isAdmin,
  isPublicProfile = false,
  currentUser,
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
  onInstallApp,
  onUserClick,
  onMessageClick
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
  
  // State for liked posts (the main one)
  const [likedPostsState, setLikedPostsState] = useState<Post[]>([]);
  const [isLikedLoading, setIsLikedLoading] = useState(false);
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [usernameError, setUsernameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = currentUser && user && currentUser.id === user.id;

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

  // Tab change handler to fetch likes
  useEffect(() => {
    if (activeTab === 'liked' && user) {
        const fetchLikes = async () => {
            setIsLikedLoading(true);
            try {
                const results = await dbService.getPostsLikedByUser(user.id);
                setLikedPostsState(results);
            } catch (e) {
                console.error("Likes fetch error:", e);
                setLikedPostsState([]);
            } finally {
                setIsLikedLoading(false);
            }
        };
        fetchLikes();
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) { document.addEventListener('mousedown', handleClickOutside); }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  useEffect(() => {
    if (isFollowModalOpen) {
        const loadUsers = async () => {
            const ids = isFollowModalOpen === 'followers' ? followData.followers : followData.following;
            if (!ids || ids.length === 0) { setFollowListUsers([]); return; }
            setIsFollowListLoading(true);
            try {
                const users = await dbService.getUsersByIds(ids);
                setFollowListUsers(users);
            } catch (e) { setFollowListUsers([]); } 
            finally { setIsFollowListLoading(false); }
        };
        loadUsers();
    } else { setFollowListUsers([]); }
  }, [isFollowModalOpen, followData]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setUsernameError('');
    const cleanUsername = editUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) { setUsernameError('Kullanıcı adı en az 3 karakter olmalı.'); setIsSaving(false); return; }
    const isUnique = await dbService.checkUsernameUnique(cleanUsername, user.id);
    if (!isUnique) { setUsernameError('Bu kullanıcı adı maalesef alınmış.'); setIsSaving(false); return; }
    try {
        await dbService.updateUser(user.id, { name: editName, username: cleanUsername, bio: editBio, avatar: editAvatar });
        setIsEditModalOpen(false);
    } catch (e) { alert("Güncellenirken bir hata oluştu."); } 
    finally { setIsSaving(false); }
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
  // Important Fix: Use the state variable correctly
  const displayPosts = activeTab === 'posts' ? userPosts : likedPostsState;

  const isFollowing = user ? followingIds.includes(user.id) : false;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-14 pb-32 animate-fadeIn relative">
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex items-center gap-6 md:gap-10 relative">
            <div className="shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl p-1 border border-gray-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-transform hover:scale-105 duration-300">
                    <img src={user.avatar} className="w-full h-full rounded-lg object-cover" alt={user.name} />
                </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 min-w-0">
                        <h2 className="text-2xl font-bold dark:text-white tracking-tight truncate">{user.name}</h2>
                        {!isOwnProfile && isPublicProfile && (
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => onFollowToggle(user.id)} className={`text-[10px] font-bold px-4 py-1.5 rounded-md border transition-all uppercase tracking-widest ${isFollowing ? 'border-gray-100 dark:border-zinc-800 text-gray-400' : 'border-wedding-500 text-wedding-500 hover:bg-wedding-500 hover:text-white'}`}>{isFollowing ? 'Takiptesin' : 'Takip Et'}</button>
                                <button onClick={() => onMessageClick?.(user)} className="text-[10px] font-bold px-4 py-1.5 rounded-md border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-wedding-500 hover:border-wedding-500 transition-all uppercase tracking-widest">MESAJ</button>
                            </div>
                        )}
                    </div>
                    {(isOwnProfile || !isPublicProfile) && (
                        <div className="relative" ref={settingsRef}>
                            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md transition-all active:scale-90 bg-gray-50 dark:bg-zinc-900"><svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg></button>
                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {isAdmin && ( <button onClick={() => { onOpenAdmin?.(); setShowSettings(false); }} className="w-full px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-b dark:border-zinc-900">Yönetici Paneli</button> )}
                                    <button onClick={() => { setIsEditModalOpen(true); setShowSettings(false); }} className="w-full px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Profili Düzenle</button>
                                    <button onClick={() => { onInstallApp(); setShowSettings(false); }} className="w-full px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Uygulamayı Yükle</button>
                                    <button onClick={() => { onLogout(); setShowSettings(false); }} className="w-full px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors border-t dark:border-zinc-900">Çıkış Yap</button>
                                    <button onClick={() => { setIsDeleteAccConfirmOpen(true); setShowSettings(false); }} className="w-full px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t dark:border-zinc-900">Hesabı Sil</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-[11px] text-gray-400 font-bold mb-3">@{user.username || 'user'}</p>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-1.5"><span className="text-sm font-bold leading-none dark:text-white">{userPosts.length}</span><span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Paylaşım</span></div>
                    <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsFollowModalOpen('followers')}><span className="text-sm font-bold leading-none dark:text-white group-hover:text-wedding-500 transition-colors">{followData.followers.length}</span><span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-wedding-500 transition-colors">Takipçi</span></div>
                    <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsFollowModalOpen('following')}><span className="text-sm font-bold leading-none dark:text-white group-hover:text-wedding-500 transition-colors">{followData.following.length}</span><span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-wedding-500 transition-colors">Takip</span></div>
                </div>
                <p className="text-xs text-gray-500 mt-4 font-normal line-clamp-2 leading-relaxed">{user.bio || "Hikayesini paylaşıyor ✨"}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setActiveTab('posts')} className={`py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all border ${activeTab === 'posts' ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg' : 'bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-900 text-gray-400 hover:text-gray-900'}`}>Paylaşımlar</button>
            <button onClick={() => setActiveTab('liked')} className={`py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all border ${activeTab === 'liked' ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg' : 'bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-900 text-gray-400 hover:text-gray-900'}`}>Beğeniler</button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {isLikedLoading && activeTab === 'liked' ? (
            <div className="col-span-3 py-24 flex flex-col items-center justify-center gap-4 animate-fadeIn">
                <div className="w-8 h-8 border-2 border-wedding-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Beğeniler Getiriliyor...</p>
            </div>
        ) : (
            <>
                {displayPosts.map((post) => (
                  <div key={post.id} onClick={() => setSelectedPost(post)} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900 rounded-md shadow-sm border border-gray-100 dark:border-zinc-800">
                    <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="post" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="flex items-center gap-3 text-white">
                            <div className="flex items-center gap-1 text-[10px] font-bold"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>{post.likes}</div>
                            <div className="flex items-center gap-1 text-[10px] font-bold"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>{post.comments.length}</div>
                        </div>
                    </div>
                  </div>
                ))}
                {displayPosts.length === 0 && (
                    <div className="col-span-3 py-24 text-center">
                        <p className="text-gray-400 font-normal text-sm italic">Henüz bir içerik yok ✨</p>
                    </div>
                )}
            </>
        )}
      </div>

      {selectedPost && (
          <div className="fixed inset-0 z-[1000] bg-white dark:bg-theme-black overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              <div className="sticky top-0 left-0 right-0 h-14 bg-white/90 dark:bg-theme-black/90 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between px-6 z-10">
                  <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group"><svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg><span className="text-[10px] font-bold uppercase tracking-widest">Kapat</span></button>
                  <span className="text-[10px] font-bold dark:text-white uppercase tracking-[0.2em] truncate max-w-[150px]">{selectedPost.user.name}</span>
                  <div className="w-10"></div>
              </div>
              <div className="w-full max-w-lg mx-auto py-8 px-4 pb-20"><PostCard post={selectedPost} onLike={onLike} onAddComment={onAddComment} onDelete={onDeletePost} isAdmin={isAdmin || currentUser?.id === selectedPost.user.id} isFollowing={followingIds.includes(selectedPost.user.id)} onFollow={() => onFollowToggle(selectedPost.user.id)} onUserClick={onUserClick} currentUserId={currentUser?.id} /></div>
          </div>
      )}
      {isFollowModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-zinc-950 rounded-2xl w-full max-w-xs md:max-w-sm max-h-[70vh] flex flex-col shadow-2xl border border-gray-100 dark:border-zinc-900 overflow-hidden">
                  <div className="p-5 border-b dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-zinc-950"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isFollowModalOpen === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}</h3><button onClick={() => setIsFollowModalOpen(null)} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                      {isFollowListLoading ? ( <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-wedding-500 border-t-transparent rounded-full animate-spin"></div></div>
                      ) : ( <div className="space-y-1">
                              {followListUsers.map(listUser => (
                                  <div key={listUser.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { onUserClick?.(listUser); setIsFollowModalOpen(null); }}><img src={listUser.avatar} className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-zinc-800 group-hover:scale-105 transition-transform" /><div className="flex flex-col"><span className="text-xs font-bold dark:text-white leading-tight group-hover:text-wedding-500 transition-colors">{listUser.name}</span><span className="text-[9px] text-wedding-500 font-bold">@{listUser.username}</span></div></div>
                                      {listUser.id !== currentUser?.id && ( <button onClick={() => onFollowToggle(listUser.id)} className={`text-[8px] font-bold px-3 py-1.5 rounded-md border transition-all uppercase tracking-wider ${followingIds.includes(listUser.id) ? 'border-gray-100 dark:border-zinc-800 text-gray-400' : 'border-wedding-500 text-wedding-500 hover:bg-wedding-500 hover:text-white'}`}>{followingIds.includes(listUser.id) ? 'Takip' : 'Takip Et'}</button> )}
                                  </div>
                              ))}
                              {followListUsers.length === 0 && ( <div className="py-12 text-center text-[10px] text-gray-400 font-normal italic">Henüz kimse yok ✨</div> )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-sm p-8 animate-in zoom-in-95 relative shadow-2xl border border-gray-100 dark:border-zinc-900">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                <h3 className="text-lg font-bold dark:text-white uppercase tracking-widest mb-10 text-center">Profilini Güncelle</h3>
                <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <div onClick={() => avatarInputRef.current?.click()} className="relative w-28 h-28 rounded-2xl border border-gray-100 dark:border-zinc-800 p-1 group cursor-pointer overflow-hidden shadow-sm bg-white dark:bg-zinc-900"><img src={editAvatar} className="w-full h-full rounded-xl object-cover" alt="avatar" /><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold tracking-[0.2em]">DEĞİŞTİR</div></div>
                        <input type="file" ref={avatarInputRef} onChange={async (e) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.readAsDataURL(e.target.files[0]); reader.onload = (ev) => setEditAvatar(ev.target?.result as string); } }} accept="image/*" className="hidden" />
                    </div>
                    <div className="space-y-4">
                        <div><label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">İsim Soyisim</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-all shadow-inner" /></div>
                        <div><label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Kullanıcı Adı (@)</label><input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-all shadow-inner" placeholder="kullanici_adi" /></div>
                        <div><label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Kısa Biyografi</label><textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none focus:border-wedding-500 transition-all h-24 resize-none font-normal shadow-inner leading-relaxed" placeholder="Gelinlik yolculuğundan bahset..." /></div>
                        {usernameError && <p className="text-[9px] text-red-500 font-bold px-1 animate-fadeIn">{usernameError}</p>}
                    </div>
                </div>
                <div className="mt-10 flex flex-col gap-2"><Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-xl text-[11px] uppercase tracking-[0.2em] bg-wedding-500 text-white shadow-lg shadow-wedding-500/20">Kaydet</Button><button onClick={() => setIsEditModalOpen(false)} className="w-full py-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center hover:text-gray-900 transition-all mt-2">Vazgeç</button></div>
            </div>
        </div>
      )}
      <ConfirmationModal isOpen={isDeleteAccConfirmOpen} title="Hesabını Sil" message="Hesabını ve tüm paylaşımlarını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz." onConfirm={() => { onDeleteAccount(); setIsDeleteAccConfirmOpen(false); }} onCancel={() => setIsDeleteAccConfirmOpen(false)} />
    </div>
  );
};
