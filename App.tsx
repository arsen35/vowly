
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
import { SearchModal } from './components/SearchModal';
import { Logo } from './components/Logo';
import { LoadingScreen } from './components/LoadingScreen'; 
import { BottomNavigation } from './components/BottomNavigation';
import { InstallModal } from './components/InstallModal';
import { NotificationToast } from './components/NotificationToast';
import { Post, User, ViewState, Comment, MediaItem, AppNotification } from './types';
import { dbService } from './services/db';
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { auth } from './services/firebase';

const App: React.FC = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.FEED);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAdminTrigger, setShowAdminTrigger] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [unreadDMCount, setUnreadDMCount] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<User | null>(null);
  
  // Notification States
  const [activeNotifications, setActiveNotifications] = useState<AppNotification[]>([]);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const logoClicks = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ADMIN_EMAILS = ['jeanbox35@gmail.com', 'swoxagency@gmail.com', 'nossdigital@gmail.com'];

  const posts = useMemo(() => {
    return allPosts.map(p => ({
      ...p,
      isLikedByCurrentUser: currentUser ? (p.likedBy || []).includes(currentUser.id) : false
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [allPosts, currentUser]);

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
    if (isAdmin) {
        dbService.performDailyCleanup();
    }
  }, [isAdmin]);

  const handleLogoClick = () => {
    logoClicks.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { logoClicks.current = 0; }, 3000);
    
    if (logoClicks.current >= 5) {
        if (isAdmin) {
            setShowAdminModal(true);
        } else {
            setShowAdminTrigger(true);
        }
        logoClicks.current = 0;
    }
    if (viewState !== ViewState.FEED) setViewState(ViewState.FEED);
  };

  // Browser Notification Permission & Sound Setup
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    // "Tin Tin" Chime Sound
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3');
    notificationSound.current.volume = 0.5;
    notificationSound.current.load();
  }, []);

  const playNotificationSound = () => {
    if (notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(e => {
            console.log("Audio play blocked, waiting for user interaction");
            // If blocked, try to play on next click
            const playOnce = () => {
                notificationSound.current?.play();
                window.removeEventListener('click', playOnce);
            };
            window.addEventListener('click', playOnce);
        });
    }
  };

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    let unsubUser: (() => void) | undefined;
    let unsubFollow: (() => void) | undefined;
    let unsubConvs: (() => void) | undefined;
    let unsubNotifs: (() => void) | undefined;

    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        clearTimeout(safetyTimer);
        
        if (unsubUser) unsubUser();
        if (unsubFollow) unsubFollow();
        if (unsubConvs) unsubConvs();
        if (unsubNotifs) unsubNotifs();

        if (user) {
            const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
            setIsAdmin(isUserAdmin);
            
            unsubUser = dbService.subscribeToUser(user.uid, (userData) => {
                if (userData) {
                    setCurrentUser(userData);
                } else {
                    const newUser: User = {
                        id: user.uid,
                        name: user.displayName || 'Yeni Üye',
                        username: `user_${user.uid.slice(0,5)}`,
                        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=A66D60&color=fff&bold=true`
                    };
                    setCurrentUser(newUser);
                    dbService.saveUser(newUser);
                }
            });

            unsubFollow = dbService.subscribeToFollowData(user.uid, (data) => {
              setFollowingIds(data.following);
            });

            unsubConvs = dbService.subscribeToConversations(user.uid, (convs) => {
              const unreadCount = convs.filter(c => c.unreadBy?.includes(user.uid)).length;
              setUnreadDMCount(unreadCount);
            });

            unsubNotifs = dbService.subscribeToNotifications(user.uid, (notifs) => {
                if (notifs.length > 0) {
                    setActiveNotifications(prev => {
                        const newNotifs = notifs.filter(n => !prev.find(an => an.id === n.id));
                        if (newNotifs.length > 0) {
                            playNotificationSound();
                            
                            // Web standard notification (works when tab is in background)
                            if (Notification.permission === "granted") {
                                newNotifs.forEach(n => {
                                    new Notification(n.senderName, {
                                        body: n.message,
                                        icon: n.senderAvatar,
                                        badge: 'https://cdn.shopify.com/s/files/1/0733/2285/6611/files/FAV-CENTER-LOGO-1.png?v=1770124550',
                                        tag: n.id // prevent duplicates
                                    });
                                });
                            }
                            return [...newNotifs, ...prev];
                        }
                        return prev;
                    });
                }
            });
        } else {
            setCurrentUser(null);
            setIsAdmin(false);
            setFollowingIds([]);
            setUnreadDMCount(0);
        }
        setIsLoading(false);
    });

    const unsubscribePosts = dbService.subscribeToPosts(setAllPosts);

    return () => {
        clearTimeout(safetyTimer);
        unsubscribeAuth();
        unsubscribePosts();
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        if (unsubUser) unsubUser();
        if (unsubFollow) unsubFollow();
        if (unsubConvs) unsubConvs();
        if (unsubNotifs) unsubNotifs();
    };
  }, []);

  const handleNotificationClick = (notif: AppNotification) => {
      dbService.markNotificationAsRead(notif.id);
      setActiveNotifications(prev => prev.filter(n => n.id !== notif.id));
      
      if (notif.type === 'dm') {
          setViewState(ViewState.CHAT);
      } else if (notif.type === 'post' && notif.relatedId) {
          const targetPost = allPosts.find(p => p.id === notif.relatedId);
          if (targetPost) {
              setViewState(ViewState.FEED);
              setTimeout(() => {
                  const el = document.getElementById(`post-${notif.relatedId}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
          }
      }
  };

  const removeNotification = (id: string) => {
      setActiveNotifications(prev => prev.filter(n => n.id !== id));
      dbService.markNotificationAsRead(id);
  };

  const testNotification = () => {
    const testNotif: AppNotification = {
      id: 'test_' + Date.now(),
      userId: currentUser?.id || 'guest',
      type: 'dm',
      senderId: 'annabella_system',
      senderName: 'Annabella Bridal ✨',
      senderAvatar: 'https://cdn.shopify.com/s/files/1/0733/2285/6611/files/FAV-CENTER-LOGO-1.png?v=1770124550',
      message: 'Bildirim sistemi başarıyla test edildi! Bu bir denemedir.',
      timestamp: Date.now(),
      read: false
    };
    
    // Trigger System Notification
    if (Notification.permission === "granted") {
        new Notification(testNotif.senderName, {
            body: testNotif.message,
            icon: testNotif.senderAvatar
        });
    }

    setActiveNotifications(prev => [testNotif, ...prev]);
    playNotificationSound();
  };

  const getPlatform = (): 'ios' | 'android' | 'desktop' => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    return 'desktop';
  };

  const handleInstallApp = async () => {
    const platform = getPlatform();
    if (platform === 'ios') { setShowInstallModal(true); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); setShowInstallModal(false); }
    } else { setShowInstallModal(true); }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setViewState(ViewState.FEED);
    } catch (e) { console.error(e); }
  };

  const handleDeleteAccount = async () => {
    if (!auth || !auth.currentUser) return;
    try {
        const user = auth.currentUser;
        await deleteUser(user);
        setCurrentUser(null);
        setIsAdmin(false);
        setViewState(ViewState.FEED);
        alert("Hesabınız başarıyla silindi.");
    } catch (e) {
        console.error(e);
        alert("Hesap silinirken bir hata oluştu. Lütfen tekrar giriş yapıp deneyin.");
    }
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

  const handleUserClick = (user: User) => {
    if (currentUser && user.id === currentUser.id) { setViewState(ViewState.PROFILE); } 
    else { setViewedUser(user); setViewState(ViewState.USER_PROFILE); }
    setShowSearchModal(false);
  };

  const handleSendMessageClick = (user: User) => {
    setChatTargetUser(user);
    setViewState(ViewState.CHAT);
  };

  const handleNewPost = async (data: any) => {
    if (!currentUser) return;
    setViewState(ViewState.FEED);
    try {
      const mediaWithUrls: MediaItem[] = [];
      for (const item of data.media) {
          if (item.file) {
              const url = await dbService.uploadMedia(item.file, 'posts');
              mediaWithUrls.push({ url, type: item.type });
          } else { mediaWithUrls.push(item); }
      }
      const newPost: Post = {
        id: Date.now().toString(),
        user: currentUser,
        media: mediaWithUrls,
        caption: data.caption,
        hashtags: data.hashtags,
        likes: 0,
        likedBy: [],
        comments: [],
        timestamp: Date.now(),
        productUrl: data.productUrl,
        location: data.location
      };
      await dbService.savePost(newPost);
    } catch (e) { console.error("Paylaşım Hatası:", e); alert("Paylaşım yapılırken bir hata oluştu."); }
  };

  const handleLike = async (postId: string, isLikedNow: boolean) => {
    if (!currentUser) { setViewState(ViewState.PROFILE); return; }
    try { 
        await dbService.toggleLike(postId, currentUser.id, isLikedNow); 
    } catch (error) {
        console.error("Like error:", error);
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
    try { await dbService.addComment(postId, newComment); } catch(error) {}
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className={`min-h-screen bg-white dark:bg-theme-black pb-24 md:pb-0 transition-colors duration-300 relative`}>
      {/* Notifications Toasts Container (In-app UI) */}
      <div className="fixed top-0 left-0 right-0 z-[4000] pointer-events-none flex flex-col items-center">
          {activeNotifications.map(n => (
              <NotificationToast 
                key={n.id} 
                notification={n} 
                onClose={removeNotification} 
                onClick={handleNotificationClick} 
              />
          ))}
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-b border-white/20 dark:border-white/10 h-14">
        <div className="w-full h-full flex items-center justify-between px-4 md:px-[20px] lg:px-[60px] 2xl:px-[100px]">
          <div className="flex items-center cursor-pointer select-none" onClick={handleLogoClick}>
            <Logo className="h-7 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 transform -translate-x-1/2">
               <button onClick={() => setViewState(ViewState.FEED)} className={`text-[10px] font-bold tracking-[0.2em] transition-all uppercase ${viewState === ViewState.FEED ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-zinc-600 hover:text-gray-900 dark:hover:text-white'}`}>AKIŞ</button>
               <button onClick={() => setViewState(ViewState.BLOG)} className={`text-[10px] font-bold tracking-[0.2em] transition-all uppercase ${viewState === ViewState.BLOG ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-zinc-600 hover:text-gray-900 dark:hover:text-white'}`}>BLOG</button>
               <button onClick={() => setViewState(ViewState.CHAT)} className={`relative text-[10px] font-bold tracking-[0.2em] transition-all uppercase ${viewState === ViewState.CHAT ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-zinc-600 hover:text-gray-900 dark:hover:text-white'}`}>
                 SOHBET
                 {unreadDMCount > 0 && <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
               </button>
               <button onClick={() => setViewState(ViewState.PROFILE)} className={`text-[10px] font-bold tracking-[0.2em] transition-all uppercase ${viewState === ViewState.PROFILE ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-zinc-600 hover:text-gray-900 dark:hover:text-white'}`}>PROFİLİM</button>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            {isAdmin && (
                <button onClick={() => setShowAdminModal(true)} className="flex items-center gap-2 text-[9px] font-bold text-red-500 uppercase tracking-widest border border-red-500/20 px-3 py-1.5 rounded-md hover:bg-red-500 hover:text-white transition-all shadow-sm">PANEL</button>
            )}
            <button onClick={() => setShowSearchModal(true)} className="p-2 text-gray-400 hover:text-wedding-500 transition-all active:scale-90" title="Arama"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">{isDarkMode ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>}</button>
            {currentUser && <div onClick={() => setViewState(ViewState.PROFILE)} className="cursor-pointer rounded-md overflow-hidden border border-gray-100 dark:border-zinc-800"><img src={currentUser.avatar} className="w-8 h-8 object-cover" alt="Avatar" /></div>}
          </div>
        </div>
      </header>
      <main className="w-full pt-14">
        <div className={`px-0 md:px-[20px] lg:px-[60px] 2xl:px-[100px] ${viewState === ViewState.FEED ? 'pt-0' : 'pt-4'}`}>
          {viewState === ViewState.FEED ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-0.5 sm:gap-6">
                {posts.map(post => ( <div id={`post-${post.id}`} key={post.id}><PostCard post={post} onLike={handleLike} onAddComment={handleAddComment} onDelete={setPostToDelete} isAdmin={isAdmin || post.user.id === currentUser?.id} isFollowing={followingIds.includes(post.user.id)} onFollow={() => handleFollowToggle(post.user.id)} onUserClick={handleUserClick} currentUserId={currentUser?.id} /></div> ))}
            </div>
          ) : viewState === ViewState.BLOG ? ( <BlogPage isAdmin={isAdmin} onOpenLogin={() => setViewState(ViewState.PROFILE)} />
          ) : viewState === ViewState.CHAT ? ( <ChatPage isAdmin={isAdmin} currentUser={currentUser} initialUser={chatTargetUser} onLoaded={() => setChatTargetUser(null)} />
          ) : viewState === ViewState.PROFILE ? ( <ProfilePage user={currentUser} isAdmin={isAdmin} onOpenAdmin={() => setShowAdminModal(true)} posts={posts} onPostClick={(p) => setViewState(ViewState.FEED)} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onDeletePost={setPostToDelete} onLoginSuccess={() => setViewState(ViewState.FEED)} onLike={handleLike} onAddComment={handleAddComment} followingIds={followingIds} onFollowToggle={handleFollowToggle} onInstallApp={handleInstallApp} onUserClick={handleUserClick} onTestNotification={testNotification} />
          ) : viewState === ViewState.USER_PROFILE && viewedUser ? ( <ProfilePage user={viewedUser} isPublicProfile={true} currentUser={currentUser} isAdmin={isAdmin} posts={posts} onPostClick={(p) => setViewState(ViewState.FEED)} onLogout={handleLogout} onDeleteAccount={() => {}} onDeletePost={setPostToDelete} onLoginSuccess={() => {}} onLike={handleLike} onAddComment={handleAddComment} followingIds={followingIds} onFollowToggle={handleFollowToggle} onInstallApp={() => {}} onUserClick={handleUserClick} onMessageClick={handleSendMessageClick} onTestNotification={() => {}} />
          ) : null}
        </div>
      </main>
      <div className="hidden md:flex fixed bottom-8 right-8 flex-col gap-3 z-50">
        <a href="https://annabellabridal.com" target="_blank" className="bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95" title="Anasayfa"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></a>
        <button onClick={handleUploadClick} className="bg-gray-900 dark:bg-white p-3 rounded-lg shadow-xl text-white dark:text-gray-900 hover:scale-105 transition-all active:scale-95" title="Paylaşım Yap"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
      </div>
      <BottomNavigation currentView={viewState === ViewState.UPLOAD ? ViewState.FEED : viewState} onNavigate={setViewState} onUploadClick={handleUploadClick} unreadDMCount={unreadDMCount} />
      {showAdminTrigger && ( <AdminLoginModal onClose={() => setShowAdminTrigger(false)} onLoginSuccess={() => { setShowAdminTrigger(false); setIsAdmin(true); setShowAdminModal(true); }} /> )}
      {showAdminModal && ( <div className="fixed inset-0 z-[2000] bg-white dark:bg-theme-black overflow-y-auto pt-20 animate-in slide-in-from-bottom-5"><AdminDashboard posts={allPosts} onDeletePost={async (id) => await dbService.deletePost(id)} onResetData={() => {}} onClose={() => setShowAdminModal(false)} /></div> )}
      {showSearchModal && ( <SearchModal onClose={() => setShowSearchModal(false)} followingIds={followingIds} onFollowToggle={handleFollowToggle} onUserClick={handleUserClick} currentUserId={currentUser?.id} /> )}
      {viewState === ViewState.UPLOAD && <UploadModal user={currentUser} onClose={() => setViewState(ViewState.FEED)} onUpload={handleNewPost} />}
      {showInstallModal && ( <InstallModal platform={getPlatform()} canTriggerNative={!!deferredPrompt} onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} /> )}
      <ConfirmationModal isOpen={!!postToDelete} title="Sil" message="Bu içeriği silmek istediğine emin misin?" onConfirm={async () => { if(postToDelete) await dbService.deletePost(postToDelete); setPostToDelete(null); }} onCancel={() => setPostToDelete(null)} />
    </div>
  );
};

export default App;
