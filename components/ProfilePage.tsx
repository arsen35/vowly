
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
    
    // Username validation
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
              <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-md flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-zinc-800 shadow-inner">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-widest">Topluluğa Katıl</h2>
              <AuthModalContent onLoginSuccess={onLoginSuccess} />
          </div>
      );
  }

  const userPosts = posts.filter(p => p.user.id === user?.id);
  const likedPosts = posts.filter(p => p.isLikedByCurrentUser);
  const displayPosts = activeTab === 'posts' ? userPosts : likedPosts;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-12 pb-24 animate-fadeIn">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-4 md:gap-14">
            <div className="shrink-0">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-md p-[1px] border border-wedding-500/20 overflow-hidden shadow-sm">
                    <img src={user.avatar} className="w-full h-full rounded-md object-cover" />
                </div>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-serif text-lg md:text-2xl font-bold dark:text-white tracking-tight truncate">{user.name}</h2>
                        <p className="text-[11px] text-wedding-500 font-bold italic">@{user.username || 'kullaniciadi_yok'}</p>
                    </div>
                    <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-wedding-500"><svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg></button>
                </div>

                <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
                    <div className="flex flex-col md:flex-row md:items-center">
                        <span className="text-sm font-bold dark:text-white">{userPosts.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold md:ml-1 mt-0.5">Gönderi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center cursor-pointer" onClick={() => setIsFollowModalOpen('followers')}>
                        <span className="text-sm font-bold dark:text-white">{followData.followers.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold md:ml-1 mt-0.5">Takipçi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center cursor-pointer" onClick={() => setIsFollowModalOpen('following')}>
                        <span className="text-sm font-bold dark:text-white">{followData.following.length}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold md:ml-1 mt-0.5">Takip</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex gap-2">
            <button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 text-gray-500 text-[10px] font-bold py-2.5 rounded-md uppercase tracking-widest">Düzenle</button>
            <button onClick={() => setActiveTab(activeTab === 'posts' ? 'liked' : 'posts')} className={`flex-1 bg-transparent border ${activeTab === 'liked' ? 'border-wedding-500 text-wedding-500' : 'border-gray-200 dark:border-zinc-800 text-gray-500'} text-[10px] font-bold py-2.5 rounded-md uppercase tracking-widest`}>{activeTab === 'posts' ? 'Beğeniler' : 'Gönderiler'}</button>
            <a href="https://annabellabridal.com" target="_blank" className="flex-1 bg-transparent border border-gray-200 dark:border-zinc-800 text-gray-500 text-[10px] font-bold py-2.5 rounded-md uppercase tracking-widest text-center">Mağaza</a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {displayPosts.map((post) => (
          <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-50 dark:bg-zinc-900 shadow-inner">
            <img src={post.media[0].url} onClick={() => setSelectedPost(post)} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-theme-dark rounded-lg w-full max-w-sm p-8 animate-in zoom-in-95 relative shadow-2xl">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                <h3 className="text-lg font-serif font-bold dark:text-white uppercase tracking-widest mb-6 text-center">Profili Düzenle</h3>
                <div className="space-y-4">
                    <div className="flex flex-col items-center mb-4">
                        <div onClick={() => avatarInputRef.current?.click()} className="relative w-20 h-20 rounded-md border-2 border-wedding-500/30 p-1 cursor-pointer overflow-hidden">
                            <img src={editAvatar} className="w-full h-full rounded-md object-cover" />
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Ad Soyad</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 border rounded-md px-4 py-2.5 text-sm dark:text-white outline-none focus:border-wedding-500" />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">@KullanıcıAdı</label>
                        <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 border rounded-md px-4 py-2.5 text-sm dark:text-white outline-none focus:border-wedding-500" placeholder="sadece_küçük_harfler" />
                        {usernameError && <p className="text-[9px] text-red-500 mt-1 font-bold uppercase">{usernameError}</p>}
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Biyografi</label>
                        <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 border rounded-md px-4 py-2 text-sm dark:text-white outline-none h-20 resize-none font-serif italic" />
                    </div>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full py-4 rounded-md">Kaydet</Button>
                    <button onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">İptal</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
