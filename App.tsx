import React, { useState, useEffect } from 'react';
import { PostCard } from './components/PostCard';
import { UploadModal } from './components/UploadModal';
import { LoginModal } from './components/LoginModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Post, User, ViewState, Comment, MediaItem } from './types';
import { dbService } from './services/db';

// Mock Initial Data (Sadece veritabanı boşsa kullanılacak)
const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    user: { id: 'u1', name: 'Ayşe Yılmaz', avatar: 'https://ui-avatars.com/api/?name=Ayşe+Yılmaz&background=fecdd3&color=881337' },
    media: [
      { url: 'https://picsum.photos/id/65/1080/1350', type: 'image' },
      { url: 'https://picsum.photos/id/103/1080/1350', type: 'image' }
    ],
    caption: 'Hayatımın en güzel günüydü. Gelinliğim içinde kendimi prenses gibi hissettim! 💍✨',
    hashtags: ['#düğün', '#gelinlik', '#mutluluk'],
    likes: 124,
    comments: [
      { id: 'c1', userId: 'u3', userName: 'Melis K.', text: 'Harika görünüyorsun canım! ❤️', timestamp: Date.now() }
    ],
    timestamp: Date.now() - 1000000,
    isLikedByCurrentUser: false
  }
];

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // App açıldığında veritabanından verileri çek
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const storedPosts = await dbService.getAllPosts();
        if (storedPosts.length > 0) {
          setPosts(storedPosts);
        } else {
          // İlk kez açılıyorsa mock verileri yükle
          // Not: Mock verileri DB'ye de kaydedebiliriz ama şimdilik state'e atalım
          setPosts(INITIAL_POSTS);
          // İsteğe bağlı: Mock verileri DB'ye kaydet
          // INITIAL_POSTS.forEach(p => dbService.savePost(p));
        }
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
        setPosts(INITIAL_POSTS);
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

    // Önce State'i güncelle (Hızlı UI)
    setPosts(prev => [newPost, ...prev]);
    setViewState(ViewState.FEED);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sonra sessizce DB'ye kaydet
    try {
        await dbService.savePost(newPost);
    } catch (error) {
        console.error("Kayıt hatası:", error);
        alert("Gönderi tarayıcıya kaydedilemedi, ancak şu an görebilirsiniz.");
    }
  };

  const handleRequestDelete = (postId: string) => {
    setPostToDelete(postId);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
        // UI'dan sil
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete));
        // DB'den sil
        await dbService.deletePost(postToDelete);
        setPostToDelete(null);
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic UI Update
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

    // DB Update
    if (updatedPost) {
        await dbService.savePost(updatedPost);
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
        await dbService.savePost(updatedPost);
    }
  };

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

  // If in Admin Dashboard Mode
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
                    <button 
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
                    >
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Navbar / Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
        <div className="w-full h-16 flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center gap-2" onClick={() => setViewState(ViewState.FEED)}>
             <div className="w-8 h-8 bg-wedding-500 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">V</div>
             <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Vowly</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin ? (
                <>
                    <button 
                       onClick={() => setViewState(ViewState.ADMIN_DASHBOARD)}
                       className="text-xs font-bold text-wedding-900 bg-wedding-50 px-3 py-1.5 rounded-full hover:bg-wedding-100 transition-colors"
                    >
                        Panele Git &rarr;
                    </button>
                    <button 
                       onClick={handleLogout}
                       className="text-xs px-3 py-1.5 rounded-full border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors"
                    >
                        Çıkış
                    </button>
                </>
            ) : (
                <button 
                   onClick={() => setShowLoginModal(true)}
                   className="text-xs px-3 py-1.5 rounded-full border font-medium bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 transition-colors"
                >
                    Yönetici
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-6 px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
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
              <div className="w-16 h-16 bg-wedding-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-wedding-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                 </svg>
              </div>
              <p className="text-wedding-900 font-serif text-xl font-medium">Henüz anı paylaşılmamış</p>
              <p className="text-gray-500 text-sm mt-2">İlk ve en özel anı paylaşan sen ol!</p>
            </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40">
        <button 
          onClick={handleUploadClick}
          className="bg-wedding-500 hover:bg-wedding-900 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl shadow-wedding-500/30 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
          aria-label="Yeni Paylaşım Yap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

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
        message="Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={handleConfirmDelete}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
};

export default App;