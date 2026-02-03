
import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDelete: (postId: string) => void;
  isAdmin: boolean;
}

interface Heart {
  id: number;
  x: number; 
  delay: number;
  color: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onAddComment, onDelete, isAdmin }) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const brandAvatar = post.user.avatar.includes('ui-avatars.com') 
    ? post.user.avatar
        .replace(/background=[^&]*/, 'background=A66D60')
        .replace(/color=[^&]*/, 'color=fff')
        .replace(/&amp;/g, '&')
    : post.user.avatar;

  useEffect(() => {
    setLikesCount(post.likes);
    setIsLiked(post.isLikedByCurrentUser);
  }, [post.likes, post.isLikedByCurrentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const triggerHearts = () => {
    const newHearts: Heart[] = [];
    for (let i = 0; i < 6; i++) {
      newHearts.push({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 40,
        delay: Math.random() * 0.3,
        color: Math.random() > 0.5 ? '#f43f5e' : '#A66D60'
      });
    }
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 1200);
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    if (newLikedState) triggerHearts();
    onLike(post.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBigHeart(true);
    setTimeout(() => setShowBigHeart(false), 1000);
    if (!isLiked) handleLike();
    else triggerHearts();
  };

  const handleShare = () => {
    const currentMedia = post.media[0];
    const mediaLink = currentMedia.url.startsWith('http') ? `\n\nMedya Linki: ${currentMedia.url}` : '';
    let siteLink = "https://blog.annabellabridal.com";
    const message = `Annabella Bridal Blog'da bu ana bak! 💍\n\n"${post.caption}"\n${mediaLink}\n\nDaha fazlası için: ${siteLink}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(post.id);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentMediaIndex < post.media.length - 1) setCurrentMediaIndex(prev => prev + 1);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentMediaIndex > 0) setCurrentMediaIndex(prev => prev - 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();
  };

  return (
    <div className="bg-white dark:bg-theme-dark sm:rounded-xl shadow-sm border-y sm:border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:scale-[0.99]">
      <div className="p-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 relative">
        <img 
          src={brandAvatar} 
          alt={post.user.name} 
          className="w-8 h-8 rounded-full object-cover border border-wedding-200 dark:border-gray-700 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-wedding-900 dark:text-white text-xs truncate tracking-tight">{post.user.name}</h3>
          <p className="text-[9px] font-semibold text-wedding-500/80 dark:text-gray-500 uppercase tracking-widest">
            {new Date(post.timestamp).toLocaleDateString('tr-TR')}
          </p>
        </div>
        
        {isAdmin && (
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold uppercase tracking-wider">Gönderiyi Sil</button>
                    </div>
                )}
            </div>
        )}
      </div>

      <div 
        className="relative w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 group touch-pan-y overflow-hidden select-none"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onDoubleClick={handleDoubleClick}
      >
        {showBigHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-like-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white drop-shadow-2xl">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
            </div>
        )}

        <div className="flex w-full h-full transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
            {post.media.map((media, index) => (
                <div key={index} className="w-full h-full flex-shrink-0 relative">
                    <img src={media.url} alt={`Post media ${index + 1}`} className="absolute inset-0 w-full h-full object-cover block" loading="lazy" />
                </div>
            ))}
        </div>
      </div>
      
      {post.productUrl && (
          <a 
            href={post.productUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 text-wedding-500 font-bold text-[10px] py-3.5 flex items-center justify-between px-5 transition-all duration-300 group tracking-[0.2em] uppercase"
          >
             <div className="flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                 </svg>
                 <span>Ürünü Mağazada Gör</span>
             </div>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 group-hover:translate-x-1 transition-transform">
               <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
             </svg>
          </a>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-5">
            <div className="relative">
                <button 
                  onClick={handleLike} 
                  className={`relative z-10 transition-transform duration-200 active:scale-75 ${isLiked ? 'text-wedding-500' : 'text-gray-900 dark:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
                {hearts.map(heart => (
                    <span
                        key={heart.id}
                        className="absolute top-0 left-0 pointer-events-none animate-float-heart"
                        style={{
                            left: `${10 + heart.x}px`,
                            color: heart.color,
                            animationDelay: `${heart.delay}s`,
                            fontSize: '1rem'
                        }}
                    >
                        ❤️
                    </span>
                ))}
            </div>

            <button onClick={() => setIsCommentOpen(!isCommentOpen)} className="text-gray-900 dark:text-white transition-transform active:scale-90">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
            </button>
            
            <button onClick={handleShare} className="text-gray-900 dark:text-white transition-transform active:scale-90">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
               </svg>
            </button>
          </div>
          <div className="font-bold text-[11px] text-gray-400 dark:text-gray-500 tracking-wider uppercase">{likesCount} beğenme</div>
        </div>
        
        <div className="text-gray-900 dark:text-gray-100 text-[13px] mb-3 leading-relaxed line-clamp-2 hover:line-clamp-none cursor-pointer">
          <span className="font-bold mr-1">{post.user.name}</span> {post.caption}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3 mt-auto">
          {post.hashtags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-wedding-500 text-[9px] font-bold bg-wedding-50 dark:bg-wedding-900/10 px-2 py-0.5 rounded-md tracking-wider">#{tag.replace('#', '')}</span>
          ))}
        </div>

        {isCommentOpen && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 mt-2 border border-gray-100 dark:border-gray-800 animate-fadeIn text-xs">
            <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto custom-scrollbar px-1">
               {post.comments.map((comment) => (
                 <div key={comment.id} className="pb-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <span className="font-bold text-wedding-900 dark:text-wedding-400 mr-1.5">{comment.userName}</span>
                    <span className="text-gray-700 dark:text-gray-300">{comment.text}</span>
                 </div>
               ))}
               {post.comments.length === 0 && <p className="text-gray-400 italic py-2 text-center">Henüz yorum yok.</p>}
            </div>
            <div className="flex gap-2 items-center bg-white dark:bg-gray-800 rounded-full px-1 py-1 border border-gray-100 dark:border-gray-700">
              <input 
                type="text" 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()} 
                placeholder="Yorum ekle..." 
                className="flex-1 bg-transparent px-3 py-1 text-[11px] outline-none text-gray-800 dark:text-white" 
              />
              <button onClick={handleSubmitComment} disabled={!commentText.trim()} className="text-wedding-500 font-bold text-[11px] px-3 disabled:opacity-30 uppercase tracking-widest">Paylaş</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
