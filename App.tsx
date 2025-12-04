import React, { useState, useEffect } from 'react';
import { PostCard } from './components/PostCard';
import { UploadModal } from './components/UploadModal';
import { LoginModal } from './components/LoginModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPage } from './components/BlogPage';
import { Post, User, ViewState, Comment, MediaItem } from './types';
import { dbService } from './services/db';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // App açıldığında Feed verilerini çek
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const storedPosts = await dbService.getAllPosts();
        setPosts(storedPosts);
      } catch (error) {
        console.error("Veritabanı hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
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

  const handleNewPost = async (data: { media: MediaItem[]; caption: string; hashtags: string[]; userName: string }) => {
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
      isLikedByCurrentUser: false
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
        alert("Bağlantı hatası: Gönderi veritabanına kaydedilemedi ama geçici olarak ekranda görünüyor.");
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
                    <div className="w-8 h-8 bg-wedding-500 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">V</div>
                    <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">Vowly</h1>
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
        <div className="w-full h-16 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState(ViewState.FEED)}>
              <div className="w-8 h-8 bg-wedding-500 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">V</div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Vowly</h1>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
               <button 
                  onClick={() => setViewState(ViewState.FEED)} 
                  className={`text-sm font-bold tracking-wide transition-colors ${viewState === ViewState.FEED ? 'text-wedding-500' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 AKIS
               </button>
               <button 
                  onClick={() => setViewState(ViewState.BLOG)} 
                  className={`text-sm font-bold tracking-wide transition-colors ${viewState === ViewState.BLOG ? 'text-wedding-500' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 BLOG
               </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             {/* Mobile Nav Toggle could go here, but using tabs for simplicity */}
             <div className="md:hidden flex bg-gray-100 rounded-full p-1 mr-2">
                <button onClick={() => setViewState(ViewState.FEED)} className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${viewState === ViewState.FEED ? 'bg-white shadow text-wedding-500' : 'text-gray-500'}`}>Akış</button>
                <button onClick={() => setViewState(ViewState.BLOG)} className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${viewState === ViewState.BLOG ? 'bg-white shadow text-wedding-500' : 'text-gray-500'}`}>Blog</button>
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
            <div className="pt-6 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
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
        ) : null}
      </main>

      {/* Floating Action Button (Only on Feed) */}
      {viewState === ViewState.FEED && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40">
          <button 
            onClick={handleUploadClick}
            className="bg-wedding-500 hover:bg-wedding-900 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl shadow-wedding-500/30 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300">
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