
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostCard } from './components/PostCard';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPage } from './components/BlogPage';
import { ChatPage } from './components/ChatPage';
import { ProfilePage } from './components/ProfilePage';
import { Logo } from './components/Logo';
import { LoadingScreen } from './components/LoadingScreen'; 
import { BottomNavigation } from './components/BottomNavigation';
import { InstallModal } from './components/InstallModal';
import { Post, User, ViewState, Comment, MediaItem } from './types';
import { dbService } from './services/db';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './services/firebase';

const App: React.FC = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const [showAdminTrigger, setShowAdminTrigger] = useState(false);
  const logoClicks = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ADMIN_EMAILS = ['jeanbox35@gmail.com', 'swoxagency@gmail.com', 'nossdigital@gmail.com'];

  // Posts with current user like status re-applied on every update
  const posts = useMemo(() => {
    const LIKED_STORAGE_KEY = 'vowly_liked_posts';
    const likedPostsStr = localStorage.getItem(LIKED_STORAGE_KEY);
    const likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : [];
    
    const processed = allPosts.map(p => ({
      ...p,
      isLikedByCurrentUser: likedPosts.includes(p.id)
    }));

    if (!followingIds.length) return processed;
    const followingPosts = processed.filter(p => followingIds.includes(p.user.id));
    const otherPosts = processed.filter(p => !followingIds.includes(p.user.id));
    return [...followingPosts, ...otherPosts];
  }, [allPosts, followingIds]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return false;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogoClick = () => {
    logoClicks.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { logoClicks.current = 0; }, 3000);
    if (logoClicks.current >= 5) {
        setShowAdminTrigger(true);
        logoClicks.current = 0;
    }
    setViewState(ViewState.FEED);
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const unsubscribeAuth = onAuthStateChanged(auth!, async (user) => {
        if (user) {
            const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
            setIsAdmin(isUserAdmin);
            
            const userData = await dbService.getUser(user.uid);
            if (userData) {
                setCurrentUser(userData);
            } else {
                const newUser: User = {
                    id: user.uid,
                    name: user.displayName || 'İsimsiz Gelin',
                    username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || `user_${user.uid.slice(0,5)}`,
                    avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'G')}&background=A66D60&color=fff&bold=true`
                };
                setCurrentUser(newUser);
                await dbService.saveUser(newUser);
            }

            dbService.subscribeToFollowData(user.uid, (data) => {
              setFollowingIds(data.following);
            });
        } else {
            setCurrentUser(null);
            setIsAdmin(false);
            setFollowingIds([]);
        }
        setIsLoading(false);
    });

    const unsubscribePosts = dbService.subscribeToPosts(setAllPosts);

    return () => {
        unsubscribeAuth();
        unsubscribePosts();
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth!);
      setCurrentUser(null);
      setIsAdmin(false);
      setViewState(ViewState.FEED);
    } catch (e) { console.error(e); }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) { setViewState(ViewState.PROFILE); return; }
    const isFollowing = followingIds.includes(targetUserId);
    try {
      if (isFollowing) await dbService.unfollowUser(currentUser.id, targetUserId);
      else await dbService.followUser(currentUser.id, targetUserId);
    } catch (e) { console.error(e); }
  };

  const handleUploadClick = () => {
      if (!currentUser) setViewState(ViewState.PROFILE);
      else setViewState(ViewState.UPLOAD);
  };

  const handleNewPost = async (data: any) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: Date.now().toString(),
      user: currentUser,
      media: data.media,
      caption: data.caption,
      hashtags: data.hashtags,
      likes: 0,
      comments: [],
      timestamp: Date.now(),
      productUrl: data.productUrl,
      location: data.location
    };
    setViewState(ViewState.FEED);
    try { await dbService.savePost(newPost); } catch (e) { console.error(e); }
  };

  const handleLike = async (postId: string) => {
    const LIKED_STORAGE_KEY = 'vowly_liked_posts';
    const likedPostsStr = localStorage.getItem(LIKED_STORAGE_KEY);
    let likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : [];
    const isAlreadyLiked = likedPosts.includes(postId);
    
    const incrementBy = isAlreadyLiked ? -1 : 1;
    if (isAlreadyLiked) {
      likedPosts = likedPosts.filter((id: string) => id !== postId);
    } else {
      likedPosts.push(postId);
    }
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedPosts));
    
    // Update local state immediately for responsiveness
    setAllPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      isLikedByCurrentUser: !isAlreadyLiked, 
      likes: Math.max(0, p.likes + incrementBy) 
    } : p));

    try { 
      await dbService.updateLikeCount(postId, incrementBy); 
    } catch (error) {
      console.error("Like error", error);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) { setViewState(ViewState.PROFILE); return; }
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: text,
      timestamp: Date.now()
    };
    setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    try { await dbService.addComment(postId, newComment); } catch(error) {}
  };

  if (isLoading) return <LoadingScreen />;

  const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android';

  return (
    <div className={`min-h-screen bg-white dark:bg-theme-black pb-24 md:pb-0 transition-colors duration-300 relative`}>
      <header className="sticky top-0 z-40 bg-white/40 dark:bg-theme-black/40 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900">
        <div className="w-full h-14 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center cursor-pointer select-none" onClick={handleLogoClick}>
            <Logo className="h-8 w-auto" />
          </div>
          
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
               <button onClick={() => setViewState(ViewState.FEED)} className={`text-[11px] font-bold tracking-widest transition-colors ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600 hover:text-wedding-500'}`}>AKIŞ</button>
               <button onClick={() => setViewState(ViewState.BLOG)} className={`text-[11px] font-bold tracking-widest transition-colors ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600 hover:text-wedding-500'}`}>BLOG</button>
               <button onClick={() => setViewState(ViewState.CHAT)} className={`text-[11px] font-bold tracking-widest flex items-center gap-1 transition-colors ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600 hover:text-wedding-500'}`}>SOHBET</button>
               <button onClick={() => setViewState(ViewState.PROFILE)} className={`text-[11px] font-bold tracking-widest transition-colors ${viewState === ViewState.PROFILE ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600 hover:text-wedding-500'}`}>PROFİLİM</button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                {isDarkMode ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>}
            </button>
            {currentUser && <div onClick={() => setViewState(ViewState.PROFILE)} className="cursor-pointer overflow-hidden rounded-full ring-2 ring-wedding-500/10"><img src={currentUser.avatar} className="w-8 h-8 object-cover" alt="P" /></div>}
          </div>
        </div>
      </header>
      
      <main className="w-full">
        {viewState === ViewState.FEED ? (
            <div className="pt-0 md:pt-6 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-0.5 sm:gap-8">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLike} 
                    onAddComment={handleAddComment} 
                    onDelete={setPostToDelete} 
                    isAdmin={isAdmin || post.user.id === currentUser?.id}
                    isFollowing={followingIds.includes(post.user.id)}
                    onFollow={() => handleFollowToggle(post.user.id)}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            </div>
        ) : viewState === ViewState.BLOG ? (
            <BlogPage isAdmin={isAdmin} onOpenLogin={() => setViewState(ViewState.PROFILE)} />
        ) : viewState === ViewState.CHAT ? (
            <ChatPage isAdmin={isAdmin} currentUser={currentUser} />
        ) : viewState === ViewState.PROFILE ? (
            <ProfilePage 
                user={currentUser} posts={posts} 
                onPostClick={(p) => setViewState(ViewState.FEED)} 
                onLogout={handleLogout}
                onDeleteAccount={() => {}}
                onDeletePost={setPostToDelete}
                onLoginSuccess={() => setViewState(ViewState.PROFILE)}
                onLike={handleLike}
                onAddComment={handleAddComment}
                followingIds={followingIds}
                onFollowToggle={handleFollowToggle}
                onInstallApp={handleInstallApp}
            />
        ) : null}
      </main>

      <BottomNavigation currentView={viewState === ViewState.UPLOAD ? ViewState.FEED : viewState} onNavigate={setViewState} onUploadClick={handleUploadClick} />
      {viewState === ViewState.UPLOAD && <UploadModal user={currentUser} onClose={() => setViewState(ViewState.FEED)} onUpload={handleNewPost} />}
      {showInstallModal && <InstallModal platform={platform} canTriggerNative={!!deferredPrompt} onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} />}
      <ConfirmationModal isOpen={!!postToDelete} title="Sil" message="Bu içeriği silmek istediğine emin misin?" onConfirm={async () => { if(postToDelete) await dbService.deletePost(postToDelete); setPostToDelete(null); }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};

export default App;
