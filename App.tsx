
import React, { useState, useEffect } from 'react';
import { PostCard } from './components/PostCard';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
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
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (user.email === 'admin@annabella.com') setIsAdmin(true);
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

  const handleShareSite = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Annabella Bridal Blog',
        text: 'En güzel gelinlik hikayeleri burada! ✨',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Sayfa linki kopyalandı! ✨');
    }
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
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-theme-black/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900">
        <div className="w-full h-14 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center cursor-pointer" onClick={() => setViewState(ViewState.FEED)}><Logo className="h-8 w-auto" /></div>
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
               <button onClick={() => setViewState(ViewState.FEED)} className={`text-[11px] font-bold tracking-widest ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600'}`}>AKIŞ</button>
               <button onClick={() => setViewState(ViewState.BLOG)} className={`text-[11px] font-bold tracking-widest ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600'}`}>BLOG</button>
               <button onClick={() => setViewState(ViewState.CHAT)} className={`text-[11px] font-bold tracking-widest flex items-center gap-1 ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400'}`}>SOHBET <span className="bg-wedding-100 dark:bg-wedding-900 text-wedding-600 dark:text-wedding-300 text-[8px] px-1 rounded-full animate-pulse">CANLI</span></button>
               <button onClick={() => setViewState(ViewState.PROFILE)} className={`text-[11px] font-bold tracking-widest ${viewState === ViewState.PROFILE ? 'text-wedding-500' : 'text-gray-400 dark:text-zinc-600'}`}>PROFİLİM</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-1.5 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-500 transition-colors">
                {isDarkMode ? '☀️' : '🌙'}
            </button>
            {currentUser ? (
                <div onClick={() => setViewState(ViewState.PROFILE)} className="cursor-pointer"><img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-black/5" alt="Profile" /></div>
            ) : (
                <button onClick={() => setShowAuthModal(true)} className="text-[10px] px-3 py-1.5 rounded-full font-bold bg-black dark:bg-white text-white dark:text-black">Giriş</button>
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
        ) : null}
      </main>

      {/* DESKTOP QUICK ACTIONS (FLOATING RIGHT BOTTOM) */}
      <div className="hidden md:flex fixed bottom-10 right-10 flex-col gap-3 z-[100]">
          <a 
            href="https://annabellabridal.com" 
            target="_blank" 
            className="w-14 h-14 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-full flex items-center justify-center shadow-2xl border border-gray-100 dark:border-zinc-800 transition-all hover:scale-110 hover:bg-wedding-50 group"
            title="Mağazaya Git"
          >
            <svg className="w-6 h-6 group-hover:text-wedding-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
          </a>
          <button 
            onClick={handleShareSite}
            className="w-14 h-14 bg-wedding-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 hover:bg-wedding-600 group"
            title="Sitemizi Paylaş"
          >
            <svg className="w-6 h-6 transform rotate-[-15deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
      </div>
      
      <BottomNavigation currentView={viewState === ViewState.UPLOAD ? ViewState.FEED : viewState} onNavigate={setViewState} onUploadClick={handleUploadClick} />
      {viewState === ViewState.UPLOAD && <UploadModal user={currentUser} onClose={() => setViewState(ViewState.FEED)} onUpload={handleNewPost} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setViewState(ViewState.FEED)} />}
      <ConfirmationModal isOpen={!!postToDelete} title="Gönderiyi Sil" message="Emin misin?" onConfirm={handleConfirmDelete} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};

export default App;
