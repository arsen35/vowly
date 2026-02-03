
import React, { useState, useEffect, useRef } from 'react';
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
import { Post, User, ViewState, Comment, MediaItem } from './types';
import { dbService } from './services/db';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './services/firebase';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // GIZLI GIRIS ICIN STATE'LER
  const [showAdminTrigger, setShowAdminTrigger] = useState(false);
  const logoClicks = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ADMIN_EMAILS = ['jeanbox35@gmail.com', 'swoxagency@gmail.com', 'nossdigital@gmail.com'];

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

  // LOGO TIKLAMA TAKIBI (SECRET TRIGGER)
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
    if (!auth) {
        setIsLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
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
                    avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'G')}&background=A66D60&color=fff&bold=true`
                };
                setCurrentUser(newUser);
                await dbService.saveUser(newUser);
            }
        } else {
            setCurrentUser(null);
            setIsAdmin(false);
        }
        setIsLoading(false);
    });

    const unsubscribePosts = dbService.subscribeToPosts((dbPosts) => {
        const LIKED_STORAGE_KEY = 'vowly_liked_posts';
        const likedPostsStr = localStorage.getItem(LIKED_STORAGE_KEY);
        const likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : [];
        const mergedPosts = dbPosts.map(p => ({
            ...p,
            isLikedByCurrentUser: likedPosts.includes(p.id)
        }));
        setPosts(mergedPosts);
    });

    return () => {
        unsubscribeAuth();
        unsubscribePosts();
    };
  }, []);

  const handleUploadClick = () => {
      if (!currentUser) setShowAuthModal(true);
      else setViewState(ViewState.UPLOAD);
  };

  const handleNewPost = async (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl: string | null; location: string | null }) => {
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
      isLikedByCurrentUser: false,
      productUrl: data.productUrl,
      location: data.location
    };
    setViewState(ViewState.FEED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { await dbService.savePost(newPost); } 
    catch (error: any) { alert(`Hata: ${error.message}`); }
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
        try { await dbService.deletePost(postToDelete); } catch (e) {}
        setPostToDelete(null);
    }
  };

  const handleLike = async (postId: string) => {
    const LIKED_STORAGE_KEY = 'vowly_liked_posts';
    const likedPostsStr = localStorage.getItem(LIKED_STORAGE_KEY);
    let likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : [];
    const isAlreadyLiked = likedPosts.includes(postId);
    const incrementBy = isAlreadyLiked ? -1 : 1;
    if (isAlreadyLiked) likedPosts = likedPosts.filter((id: string) => id !== postId);
    else likedPosts.push(postId);
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedPosts));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLikedByCurrentUser: !isAlreadyLiked, likes: p.likes + incrementBy } : p));
    try { await dbService.updateLikeCount(postId, incrementBy); } catch (error) {}
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) { setShowAuthModal(true); return; }
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: text,
      timestamp: Date.now()
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    try { await dbService.addComment(postId, newComment); } catch(error) {}
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className={`min-h-screen bg-white dark:bg-theme-black pb-24 md:pb-0 transition-colors duration-300 relative`}>
      <header className="sticky top-0 z-30 bg-white/40 dark:bg-theme-black/40 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900">
        <div className="w-full h-14 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center cursor-pointer select-none" onClick={handleLogoClick}>
            <Logo className="h-8 w-auto" />
          </div>
          
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
               <button onClick={() => setViewState(ViewState.FEED)} className={`text-[11px] font-bold tracking-widest ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600'}`}>AKIŞ</button>
               <button onClick={() => setViewState(ViewState.BLOG)} className={`text-[11px] font-bold tracking-widest ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600'}`}>BLOG</button>
               <button onClick={() => setViewState(ViewState.CHAT)} className={`text-[11px] font-bold tracking-widest flex items-center gap-1 ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400'}`}>SOHBET <span className="bg-wedding-100 dark:bg-wedding-900 text-wedding-600 dark:text-wedding-300 text-[8px] px-1 rounded-full animate-pulse">CANLI</span></button>
               <button onClick={() => setViewState(ViewState.PROFILE)} className={`text-[11px] font-bold tracking-widest ${viewState === ViewState.PROFILE ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600'}`}>PROFİLİM</button>
          </nav>

          <div className="flex items-center gap-4">
            {/* GIZLI YONETICI BUTONU (LOGOYLA AKTIF OLUR) */}
            {showAdminTrigger && !isAdmin && (
                <button 
                  onClick={() => setShowAdminModal(true)} 
                  className="text-[8px] px-3 py-1.5 rounded-[5px] font-bold border border-wedding-500 text-wedding-500 bg-transparent hover:bg-wedding-50 transition-all tracking-widest uppercase animate-fadeIn"
                >
                  YÖNETİCİ GİRİŞİ
                </button>
            )}

            {isAdmin && (
                <button 
                  onClick={() => setViewState(ViewState.ADMIN_DASHBOARD)} 
                  className="text-[8px] px-3 py-1.5 rounded-[5px] font-bold bg-wedding-500 text-white transition-all tracking-widest uppercase"
                >
                  PANEL
                </button>
            )}

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors">
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                )}
            </button>

            {currentUser ? (
                <div onClick={() => setViewState(ViewState.PROFILE)} className="cursor-pointer">
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5" alt="Profile" />
                </div>
            ) : (
                <button 
                  onClick={() => setShowAuthModal(true)} 
                  className="text-[9px] px-4 py-2 rounded-[5px] font-bold border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white hover:border-wedding-500 hover:text-wedding-500 transition-all tracking-widest uppercase"
                >
                  Giriş Yap
                </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="w-full">
        {viewState === ViewState.FEED ? (
            <div className="pt-0 md:pt-4 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-0.5 sm:gap-6">
                {posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onAddComment={handleAddComment} onDelete={setPostToDelete} isAdmin={isAdmin || post.user.id === currentUser?.id} />)}
              </div>
            </div>
        ) : viewState === ViewState.BLOG ? (
            <BlogPage isAdmin={isAdmin} onOpenLogin={() => setShowAuthModal(true)} />
        ) : viewState === ViewState.CHAT ? (
            <ChatPage isAdmin={isAdmin} />
        ) : viewState === ViewState.PROFILE ? (
            <ProfilePage 
                user={currentUser} posts={posts} 
                onPostClick={(p) => setViewState(ViewState.FEED)} 
                onLogout={() => { setCurrentUser(null); setViewState(ViewState.FEED); }}
                onDeleteAccount={() => {}}
                onDeletePost={setPostToDelete}
            />
        ) : viewState === ViewState.ADMIN_DASHBOARD ? (
            <AdminDashboard posts={posts} onDeletePost={setPostToDelete} onResetData={() => dbService.clearAll()} onClose={() => setViewState(ViewState.FEED)} />
        ) : null}
      </main>

      <BottomNavigation currentView={viewState === ViewState.UPLOAD ? ViewState.FEED : viewState} onNavigate={setViewState} onUploadClick={handleUploadClick} />
      {viewState === ViewState.UPLOAD && <UploadModal user={currentUser} onClose={() => setViewState(ViewState.FEED)} onUpload={handleNewPost} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setViewState(ViewState.FEED)} />}
      {showAdminModal && <AdminLoginModal onClose={() => setShowAdminModal(false)} onLoginSuccess={() => { setIsAdmin(true); setShowAdminTrigger(false); }} />}
      <ConfirmationModal isOpen={!!postToDelete} title="Gönderiyi Sil" message="Emin misin?" onConfirm={handleConfirmDelete} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};

export default App;
