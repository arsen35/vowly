
import React, { useState, useEffect } from 'react';
import { PostCard } from './components/PostCard';
import { UploadModal } from './components/UploadModal';
import { LoginModal } from './components/LoginModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPage } from './components/BlogPage';
import { ChatPage } from './components/ChatPage';
import { Post, User, ViewState, Comment, MediaItem } from './types';
import { dbService } from './services/db';
import { signInAnonymously } from "firebase/auth";
import { auth } from './services/firebase';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Varsayılan olarak her zaman FEED (Akış) açılsın
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // App açıldığında Feed verilerini çek ve Anonim Giriş yap
  useEffect(() => {
    const initApp = async () => {
      // 1. Anonim Giriş Yap (Veritabanı yazma izni için)
      if (auth) {
        try {
          await signInAnonymously(auth);
          console.log("Misafir girişi başarılı");
        } catch (error) {
          console.error("Misafir girişi hatası:", error);
        }
      }

      // 2. Postları Çek
      try {
        const storedPosts = await dbService.getAllPosts();
        setPosts(storedPosts);
      } catch (error) {
        console.error("Veritabanı hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
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
        setPosts([]);
        alert("Veritabanı temizlendi!");
    }
  };

  const handleNewPost = async (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string; productUrl?: string }) => {
    const guestUser: User = {
        id: `guest-${Date.now()}`,
        name: data.userName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.userName)}&background=fecdd3&color=881337`
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

    // UI Güncelle (Hızlı tepki için)
    setPosts(prev => [newPost, ...prev]);
    setViewState(ViewState.FEED);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // DB Kaydet
    try {
        await dbService.savePost(newPost);
    } catch (error) {
        console.error("Kayıt hatası:", error);
        alert("Bağlantı hatası: Fotoğraf yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
    }
  };

  const handleRequestDelete = (postId: string) => {
    setPostToDelete(postId);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete));
        try {
          await dbService.deletePost(postToDelete);
        } catch (e) {
          console.error("Silme hatası", e);
        }
        setPostToDelete(null);
    }
  };

  const handleLike = async (postId: string) => {
    let updatedPost: Post | undefined;
    
    setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
            const isLiked = !post.isLikedByCurrentUser;
            updatedPost = {
                ...post,
                isLikedByCurrentUser: isLiked,
                likes: isLiked ? post.likes + 1 : post.likes - 1
            };
            return updatedPost;
        }
        return post;
    }));

    if (updatedPost) {
        try {
          await dbService.savePost(updatedPost);
        } catch(e) { console.warn("Like kaydedilemedi"); }
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

    let updatedPost: Post | undefined;

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        updatedPost = {
          ...post,
          comments: [...post.comments, newComment]
        };
        return updatedPost;
      }
      return post;
    }));

    if (updatedPost) {
        try {
          await dbService.savePost(updatedPost);
        } catch(e) { console.warn("Yorum kaydedilemedi"); }
    }
  };

  // --- RENDER HELPERS ---

  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                 <div className="w-12 h-12 bg-wedding-200 rounded-lg mb-4"></div>
                 <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
          </div>
      );
  }

  // Admin Dashboard Mode
  if (viewState === ViewState.ADMIN_DASHBOARD) {
      return (
          <div className="min-h-screen bg-gray-50">
             <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm h-16 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
                    {/* Admin Logosu Kalabilir veya kaldırılabilir, burada tuttum */}
                    <div className="w-8 h-8 bg-wedding-500 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">A</div>
                    <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">Annabella</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 hidden sm:block">Yönetici Modu</span>
                    <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors">
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

  // Main Layout
  return (
    <div className={`min-h-screen bg-gray-50 ${viewState === ViewState.CHAT ? 'pb-0' : 'pb-24'}`}>
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
        <div className="w-full h-16 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center gap-8 min-w-0">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                Annabella Blog
              </h1>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
               <button 
                  onClick={() => setViewState(ViewState.FEED)} 
                  className={`text-sm font-bold tracking-wide transition-colors ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 AKIŞ
               </button>
               <button 
                  onClick={() => setViewState(ViewState.BLOG)} 
                  className={`text-sm font-bold tracking-wide transition-colors ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 BLOG
               </button>
               <button 
                  onClick={() => setViewState(ViewState.CHAT)} 
                  className={`text-sm font-bold tracking-wide transition-colors flex items-center gap-1 ${viewState === ViewState.CHAT ? 'text-wedding-500' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 SOHBET
                 <span className="bg-wedding-100 text-wedding-600 text-[9px] px-1.5 rounded-full animate-pulse">CANLI</span>
               </button>
               <a 
                  href="https://www.annabellabridal.com"
                  className="text-sm font-bold tracking-wide text-gray-400 hover:text-wedding-900 transition-colors flex items-center gap-1"
               >
                 MAĞAZA
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                 </svg>
               </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
             {/* Mobile Nav Toggle */}
             <div className="md:hidden flex bg-gray-100 rounded-full p-1 mr-2 gap-1">
                <button onClick={() => setViewState(ViewState.FEED)} className={`px-2 py-1 text-xs rounded-full font-bold transition-all ${viewState === ViewState.FEED ? 'bg-white shadow text-wedding-500' : 'text-gray-500'}`}>Akış</button>
                <button onClick={() => setViewState(ViewState.BLOG)} className={`px-2 py-1 text-xs rounded-full font-bold transition-all ${viewState === ViewState.BLOG ? 'bg-white shadow text-wedding-500' : 'text-gray-500'}`}>Blog</button>
                <button onClick={() => setViewState(ViewState.CHAT)} className={`px-2 py-1 text-xs rounded-full font-bold transition-all ${viewState === ViewState.CHAT ? 'bg-white shadow text-wedding-500' : 'text-gray-500'}`}>Sohbet</button>
             </div>

            {isAdmin ? (
                <>
                    <button 
                       onClick={() => setViewState(ViewState.ADMIN_DASHBOARD)}
                       className="text-xs font-bold text-wedding-900 bg-wedding-50 px-3 py-1.5 rounded-full hover:bg-wedding-100 transition-colors"
                    >
                        Panel
                    </button>
                    <button 
                       onClick={handleLogout}
                       className="text-xs px-3 py-1.5 rounded-full border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors hidden sm:block"
                    >
                        Çıkış
                    </button>
                </>
            ) : (
                <button 
                   onClick={() => setShowLoginModal(true)}
                   className="text-xs px-3 py-1.5 rounded-full border font-medium bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 transition-colors"
                >
                    Giriş
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full">
        {viewState === ViewState.FEED ? (
            <div className="pt-1 md:pt-4 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-y-4 sm:gap-6">
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
                    <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl inline-block mb-4 max-w-md">
                        <p className="font-bold text-sm">Kurulum Gerekli</p>
                        <p className="text-xs mt-1">Firebase kurulumu henüz tamamlanmadı. Veriler kaydedilmeyecek.</p>
                    </div>
                    <p className="text-wedding-900 font-serif text-xl font-medium">Henüz anı paylaşılmamış</p>
                    <p className="text-gray-500 text-sm mt-2">İlk anı sen paylaş!</p>
                  </div>
              )}
            </div>
        ) : viewState === ViewState.BLOG ? (
            <BlogPage isAdmin={isAdmin} />
        ) : viewState === ViewState.CHAT ? (
            <ChatPage isAdmin={isAdmin} />
        ) : null}
      </main>

      {/* Floating Action Buttons (Only on Feed) */}
      {viewState === ViewState.FEED && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 flex flex-col gap-4 items-center">
          
          {/* Store Button */}
          <a 
            href="https://www.annabellabridal.com"
            className="bg-white hover:bg-gray-50 text-gray-800 w-12 h-12 md:w-14 md:h-14 rounded-full shadow-xl shadow-black/10 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 border border-gray-100 group"
            title="Mağazaya Git"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-wedding-900 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </a>

          {/* Upload Button */}
          <button 
            onClick={handleUploadClick}
            className="bg-wedding-500 hover:bg-wedding-900 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-xl shadow-wedding-500/30 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-90 transition-transform duration-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      )}

      {/* Modals */}
      {viewState === ViewState.UPLOAD && (
        <UploadModal 
          onClose={() => setViewState(ViewState.FEED)}
          onUpload={handleNewPost}
        />
      )}

      {showLoginModal && (
        <LoginModal 
            onClose={() => setShowLoginModal(false)} 
            onLogin={handleLoginSubmit} 
        />
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
