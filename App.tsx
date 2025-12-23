
import React, { useState, useEffect } from 'react';
import { PostCard } from './components/PostCard';
import { UploadModal } from './components/UploadModal';
import { LoginModal } from './components/LoginModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPage } from './components/BlogPage';
import { ChatPage } from './components/ChatPage';
import { Logo } from './components/Logo';
import { LoadingScreen } from './components/LoadingScreen'; 
import { Post, User, ViewState, Comment, MediaItem } from './types';
import { dbService } from './services/db';
import { signInAnonymously } from "firebase/auth";
import { auth } from './services/firebase';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

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
    const initAuth = async () => {
      if (auth) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Misafir girişi hatası:", error);
        }
      }
    };
    initAuth();

    const unsubscribe = dbService.subscribeToPosts((dbPosts) => {
        const LIKED_STORAGE_KEY = 'vowly_liked_posts';
        const likedPostsStr = localStorage.getItem(LIKED_STORAGE_KEY);
        const likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : [];

        const mergedPosts = dbPosts.map(p => ({
            ...p,
            isLikedByCurrentUser: likedPosts.includes(p.id)
        }));
        
        setPosts(mergedPosts);
        setTimeout(() => setIsLoading(false), 2000);
    });

    return () => unsubscribe();
  }, []);

  const handleUploadClick = () => {
    setViewState(ViewState.UPLOAD);
  };

  const handleLoginSubmit = (password: string) => {
    if (password === "bella#8079") {
        setIsAdmin(true);
        setShowLoginModal(false);
    } else {
        alert("Hatalı şifre!");
    }
  };

  const handleLogout = () => {
      setIsAdmin(false);
      setViewState(ViewState.FEED);
  };

  const handleResetData = async () => {
    if (window.confirm("Tüm veriler (fotoğraflar dahil) kalıcı olarak silinecek. Emin misiniz?")) {
        await dbService.clearAll();
        alert("Veritabanı temizlendi!");
    }
  };

  const handleNewPost = async (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl?: string }) => {
    const guestUser: User = {
        id: `guest-${Date.now()}`,
        name: data.userName,
        // ARKA PLAN: Gül Kurusu (#A66D60), YAZI: Beyaz (#fff) - Tam marka uyumu
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.userName)}&background=A66D60&color=fff&bold=true`
    };

    const newPost: Post = {
      id: Date.now().toString(),
      user: guestUser,
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

  const handleRequestDelete = (postId: string) => {
    setPostToDelete(postId);
  };

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
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: `guest-${Date.now()}`,
      userName: 'Misafir',
      text: text,
      timestamp: Date.now()
    };

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    try {
        await dbService.addComment(postId, newComment);
    } catch(error) { 
        console.error("❌ Yorum kaydedilemedi:", error);
    }
  };

  if (isLoading) {
      return <LoadingScreen />;
  }

  if (viewState === ViewState.ADMIN_DASHBOARD) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-black">
             <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm h-16 flex items-center px-6 justify-between transition-colors duration-300">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
                    <Logo className="h-8" />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Yönetici Modu</span>
                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                    >
                        {isDarkMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                        )}
                    </button>
                    <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-full border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 text-red-600 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        Çıkış Yap
                    </button>
                </div>
             </header>
             <AdminDashboard 
                posts={posts} 
                onDeletePost={handleRequestDelete} 
                onResetData={handleResetData}
                onClose={() => setViewState(ViewState.FEED)} 
             />
             <ConfirmationModal 
                isOpen={!!postToDelete}
                title="Gönderiyi Sil"
                message="Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setPostToDelete(null)}
            />
          </div>
      );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black pb-20 md:pb-0 transition-colors duration-300`}>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="w-full h-16 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
             <Logo className="h-9 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
               <button 
                  onClick={() => setViewState(ViewState.FEED)} 
                  className={`text-sm font-bold tracking-wide transition-colors ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
               >
                 AKIŞ
               </button>
               <button 
                  onClick={() => setViewState(ViewState.BLOG)} 
                  className={`text-sm font-bold tracking-wide transition-colors ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
               >
                 BLOG
               </button>
               <button 
                  onClick={() => setViewState(ViewState.CHAT)} 
                  className={`text-sm font-bold tracking-wide transition-colors flex items-center gap-1 ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}
               >
                 SOHBET
                 <span className="bg-wedding-100 dark:bg-wedding-900 text-wedding-600 dark:text-wedding-300 text-[9px] px-1.5 rounded-full animate-pulse">CANLI</span>
               </button>
               <a 
                  href="https://www.annabellabridal.com"
                  className="text-sm font-bold tracking-wide text-gray-400 dark:text-gray-500 hover:text-wedding-900 dark:hover:text-wedding-400 transition-colors flex items-center gap-1"
               >
                 MAĞAZA
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                 </svg>
               </a>
          </nav>
          <div className="flex items-center gap-3">
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Karanlık Modu Değiştir"
            >
                {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                )}
            </button>
            {isAdmin ? (
                <button 
                   onClick={() => setViewState(ViewState.ADMIN_DASHBOARD)}
                   className="text-xs font-bold text-wedding-900 bg-wedding-50 px-3 py-1.5 rounded-full hover:bg-wedding-100 transition-colors"
                >
                    Panel
                </button>
            ) : (
                <button 
                   onClick={() => setShowLoginModal(true)}
                   className="text-xs px-4 py-2 rounded-full font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md"
                >
                    Giriş
                </button>
            )}
          </div>
        </div>
      </header>
      <main className="w-full">
        {viewState === ViewState.FEED ? (
            <div className="pt-0 md:pt-4 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-4 sm:gap-6">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLike} 
                    onAddComment={handleAddComment}
                    onDelete={handleRequestDelete}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
              {posts.length === 0 && (
                  <div className="text-center py-20 animate-fadeIn">
                    <p className="text-wedding-900 dark:text-wedding-500 font-serif text-xl font-medium">Henüz anı paylaşılmamış</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">İlk anı sen paylaş!</p>
                  </div>
              )}
            </div>
        ) : viewState === ViewState.BLOG ? (
            <BlogPage isAdmin={isAdmin} />
        ) : viewState === ViewState.CHAT ? (
            <ChatPage isAdmin={isAdmin} />
        ) : null}
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 z-50 px-2 pb-safe transition-colors duration-300">
          <button onClick={() => setViewState(ViewState.FEED)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={viewState === ViewState.FEED ? "currentColor" : "none"} stroke="currentColor" strokeWidth={viewState === ViewState.FEED ? 0 : 2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
             </svg>
             <span className="text-[10px] font-medium">Akış</span>
          </button>
          <button onClick={() => setViewState(ViewState.BLOG)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={viewState === ViewState.BLOG ? "currentColor" : "none"} stroke="currentColor" strokeWidth={viewState === ViewState.BLOG ? 0 : 2} className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
             </svg>
             <span className="text-[10px] font-medium">Blog</span>
          </button>
          <button onClick={handleUploadClick} className="flex flex-col items-center justify-center w-full h-full -mt-6">
             <div className="bg-wedding-500 text-white rounded-full p-3 shadow-lg shadow-wedding-500/40 transform active:scale-95 transition-transform border-4 border-gray-50 dark:border-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
             </div>
             <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1">Ekle</span>
          </button>
          <button onClick={() => setViewState(ViewState.CHAT)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-400 dark:text-gray-500'}`}>
             <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={viewState === ViewState.CHAT ? "currentColor" : "none"} stroke="currentColor" strokeWidth={viewState === ViewState.CHAT ? 0 : 2} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.197.388-1.609.208-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-wedding-500 rounded-full border-2 border-white dark:border-gray-900"></span>
             </div>
             <span className="text-[10px] font-medium">Sohbet</span>
          </button>
          <a href="https://www.annabellabridal.com" className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 dark:text-gray-500">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
             </svg>
             <span className="text-[10px] font-medium">Mağaza</span>
          </a>
      </div>
      {viewState === ViewState.FEED && (
        <div className="hidden md:flex fixed bottom-10 right-10 z-40 flex-col gap-4 items-center">
          <a href="https://www.annabellabridal.com" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white w-14 h-14 rounded-full shadow-xl shadow-black/10 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 border border-gray-100 dark:border-gray-700 group" title="Mağazaya Git">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-wedding-900 dark:group-hover:text-wedding-400 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </a>
          <button onClick={handleUploadClick} className="bg-wedding-500 hover:bg-wedding-900 text-white w-14 h-14 rounded-full shadow-xl shadow-wedding-500/30 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      )}
      {viewState === ViewState.UPLOAD && (
        <UploadModal onClose={() => setViewState(ViewState.FEED)} onUpload={handleNewPost} />
      )}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLoginSubmit} />
      )}
      <ConfirmationModal 
        isOpen={!!postToDelete}
        title="Gönderiyi Sil"
        message="Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
};

export default App;
