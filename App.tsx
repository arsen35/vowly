
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
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

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
            // Admin kontrolü (İstersen burayı email bazlı yapabilirsin)
            if (user.email === 'admin@annabella.com') setIsAdmin(true);
            
            // Kullanıcı bilgilerini DB'den al veya oluştur
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
      if (!currentUser) {
          setShowAuthModal(true);
      } else {
          setViewState(ViewState.UPLOAD);
      }
  };

  const handleLogout = () => {
      setViewState(ViewState.FEED);
  };

  const handleDeleteAccount = async () => {
      if (currentUser) {
          await dbService.deleteUserAccount(currentUser.id);
          if (auth?.currentUser) await auth.currentUser.delete();
          setCurrentUser(null);
          setViewState(ViewState.FEED);
          setShowDeleteAccountModal(false);
      }
  };

  const handleResetData = async () => {
    if (window.confirm("Tüm veriler (fotoğraflar dahil) kalıcı olarak silinecek. Emin misiniz?")) {
        await dbService.clearAll();
        alert("Veritabanı temizlendi!");
    }
  };

  const handleNewPost = async (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl?: string }) => {
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
      productUrl: data.productUrl
    };

    setViewState(ViewState.FEED);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        await dbService.savePost(newPost);
    } catch (error: any) {
        console.error("❌ Kayıt hatası:", error);
        alert(`Yükleme hatası: ${error.message}`);
    }
  };

  const handleRequestDelete = (postId: string) => setPostToDelete(postId);

  const handleConfirmDelete = async () => {
    if (postToDelete) {
        try {
          await dbService.deletePost(postToDelete);
        } catch (e) {
          console.error("❌ Silme hatası", e);
        }
        setPostToDelete(null);
    }
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

    setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
            return { 
                ...post, 
                isLikedByCurrentUser: !isAlreadyLiked, 
                likes: post.likes + incrementBy 
            };
        }
        return post;
    }));

    try {
        await dbService.updateLikeCount(postId, incrementBy);
    } catch (error) {
        console.error("Like update failed:", error);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) {
        setShowAuthModal(true);
        return;
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: text,
      timestamp: Date.now()
    };

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    }));

    try {
        await dbService.addComment(postId, newComment);
    } catch(error) { 
        console.error("❌ Yorum kaydedilemedi:", error);
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (viewState === ViewState.ADMIN_DASHBOARD) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-100 antialiased">
             <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm h-14 flex items-center px-6 justify-between transition-colors duration-300">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
                    <Logo className="h-7" />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Yönetici Modu</span>
                    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-full border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 text-red-600 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        Çıkış Yap
                    </button>
                </div>
             </header>
             <AdminDashboard posts={posts} onDeletePost={handleRequestDelete} onResetData={handleResetData} onClose={() => setViewState(ViewState.FEED)} />
             <ConfirmationModal isOpen={!!postToDelete} title="Gönderiyi Sil" message="Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?" onConfirm={handleConfirmDelete} onCancel={() => setPostToDelete(null)} />
          </div>
      );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300`}>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="w-full h-14 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
             <Logo className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
               <button onClick={() => setViewState(ViewState.FEED)} className={`text-xs font-bold tracking-widest transition-colors ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>AKIŞ</button>
               <button onClick={() => setViewState(ViewState.BLOG)} className={`text-xs font-bold tracking-widest transition-colors ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>BLOG</button>
               <button onClick={() => setViewState(ViewState.CHAT)} className={`text-xs font-bold tracking-widest transition-colors flex items-center gap-1 ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}>SOHBET <span className="bg-wedding-100 dark:bg-wedding-900 text-wedding-600 dark:text-wedding-300 text-[8px] px-1 rounded-full animate-pulse">CANLI</span></button>
               <button onClick={() => setViewState(ViewState.PROFILE)} className={`text-xs font-bold tracking-widest transition-colors ${viewState === ViewState.PROFILE ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>PROFİLİM</button>
               <a href="https://www.annabellabridal.com" target="_blank" className="text-xs font-bold tracking-widest text-gray-400 dark:text-gray-500 hover:text-wedding-900 dark:hover:text-wedding-400 transition-colors flex items-center gap-1">MAĞAZA</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none">
                {isDarkMode ? '☀️' : '🌙'}
            </button>
            {isAdmin ? (
                <button onClick={() => setViewState(ViewState.ADMIN_DASHBOARD)} className="text-[10px] font-bold text-wedding-900 bg-wedding-50 px-2.5 py-1 rounded-full hover:bg-wedding-100 transition-colors">Panel</button>
            ) : currentUser ? (
                <div onClick={() => setViewState(ViewState.PROFILE)} className="cursor-pointer">
                    <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-wedding-200" alt="Profile" />
                </div>
            ) : (
                <button onClick={() => setShowAuthModal(true)} className="text-[10px] px-3 py-1.5 rounded-full font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm">Giriş</button>
            )}
          </div>
        </div>
      </header>
      <main className="w-full">
        {viewState === ViewState.FEED ? (
            <div className="pt-0 md:pt-4 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-4 sm:gap-6">
                {posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onAddComment={handleAddComment} onDelete={handleRequestDelete} isAdmin={isAdmin || post.user.id === currentUser?.id} />)}
              </div>
            </div>
        ) : viewState === ViewState.BLOG ? (
            <BlogPage isAdmin={isAdmin} onOpenLogin={() => setShowAuthModal(true)} />
        ) : viewState === ViewState.CHAT ? (
            <ChatPage isAdmin={isAdmin} />
        ) : viewState === ViewState.PROFILE ? (
            <ProfilePage 
                user={currentUser} 
                posts={posts} 
                onPostClick={(p) => { setViewState(ViewState.FEED); setTimeout(() => { document.getElementById(p.id)?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} 
                onLogout={handleLogout}
                onDeleteAccount={() => setShowDeleteAccountModal(true)}
                onDeletePost={handleRequestDelete}
            />
        ) : null}
      </main>
      
      <BottomNavigation currentView={viewState === ViewState.UPLOAD ? ViewState.FEED : viewState} onNavigate={setViewState} onUploadClick={handleUploadClick} />
      {viewState === ViewState.UPLOAD && <UploadModal onClose={() => setViewState(ViewState.FEED)} onUpload={handleNewPost} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setViewState(ViewState.FEED)} />}
      
      <ConfirmationModal isOpen={!!postToDelete} title="Gönderiyi Sil" message="Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?" onConfirm={handleConfirmDelete} onCancel={() => setPostToDelete(null)} />
      
      <ConfirmationModal 
        isOpen={showDeleteAccountModal} 
        title="Hesabı Sil" 
        message="Hesabın ve tüm paylaşımların kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?" 
        onConfirm={handleDeleteAccount} 
        onCancel={() => setShowDeleteAccountModal(false)} 
      />
    </div>
  );
};

export default App;
