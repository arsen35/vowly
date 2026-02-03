
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
    const message = `Annabella Bridal Blog'da bu ana bak! 💍\n\n"${post.caption}"\n\nDaha fazlası için: https://blog.annabellabridal.com`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <div className="bg-white dark:bg-theme-dark sm:rounded-xl border-y sm:border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full transform transition-all duration-300">
      {/* HEADER */}
      <div className="p-3 flex items-center gap-3 relative">
        <img 
          src={post.user.avatar} 
          alt={post.user.name} 
          className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-gray-800"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-900 dark:text-white text-[13px] truncate">{post.user.name}</h3>
            {post.location && (
                <span className="text-[10px] text-wedding-500 font-medium opacity-80">• {post.location}</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Annabella Gelini ✨</p>
        </div>
        
        {isAdmin && (
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-20 py-1 animate-in fade-in zoom-in-95">
                        <button onClick={() => { setIsMenuOpen(false); onDelete(post.id); }} className="w-full text-left px-4 py-2 text-xs text-red-600 font-bold uppercase tracking-wider">Sil</button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* MEDIA */}
      <div 
        className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-gray-900 group overflow-hidden select-none"
        onDoubleClick={handleDoubleClick}
      >
        {showBigHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-like-bounce">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-white drop-shadow-2xl">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
            </div>
        )}

        <div className="flex w-full h-full transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
            {post.media.map((media, index) => (
                <div key={index} className="w-full h-full flex-shrink-0 relative">
                    <img src={media.url} alt="Post" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                </div>
            ))}
        </div>
      </div>
      
      {/* SHOP BUTTON */}
      {post.productUrl && (
          <a href={post.productUrl} target="_blank" className="w-full bg-gray-50 dark:bg-gray-800/50 py-3 px-5 flex items-center justify-between text-[10px] font-bold text-gray-900 dark:text-gray-300 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                 Ürünü Gör
             </div>
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </a>
      )}

      {/* INTERACTIONS */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleLike} 
                  className={`transition-transform duration-200 active:scale-75 ${isLiked ? 'text-wedding-500' : 'text-gray-900 dark:text-white'}`}
                >
                  <svg fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{likesCount}</span>
                {hearts.map(heart => (
                    <span key={heart.id} className="absolute pointer-events-none animate-float-heart" style={{ left: `${20 + heart.x}px`, color: heart.color, animationDelay: `${heart.delay}s` }}>❤️</span>
                ))}
            </div>

            <div className="flex items-center gap-1.5">
                <button onClick={() => setIsCommentOpen(!isCommentOpen)} className="text-gray-900 dark:text-white active:scale-90">
                   <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7">
                    <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{post.comments.length}</span>
            </div>
            
            <button onClick={handleShare} className="text-gray-900 dark:text-white active:scale-90 transform rotate-[-15deg] mt-0.5">
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6.5 h-6.5">
                 <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
               </svg>
            </button>
          </div>
        </div>
        
        <div className="text-[13px] mb-3 leading-relaxed">
          <span className="font-bold mr-1.5 dark:text-white">{post.user.name}</span>
          <span className="text-gray-700 dark:text-gray-300">{post.caption}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="text-wedding-500 text-[9px] font-bold uppercase tracking-widest opacity-80">#{tag.replace('#', '')}</span>
          ))}
        </div>

        {isCommentOpen && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mt-3 border border-gray-100 dark:border-gray-800 animate-fadeIn">
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar px-1">
               {post.comments.map((comment) => (
                 <div key={comment.id} className="text-[11px] pb-1 border-b border-gray-100 dark:border-gray-700/30 last:border-0">
                    <span className="font-bold text-gray-900 dark:text-wedding-400 mr-1">{comment.userName}</span>
                    <span className="text-gray-600 dark:text-gray-300">{comment.text}</span>
                 </div>
               ))}
            </div>
            <div className="flex gap-2 items-center bg-white dark:bg-gray-800 rounded-full px-1 py-1">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()} placeholder="Yorum yap..." className="flex-1 bg-transparent px-3 text-[11px] outline-none dark:text-white" />
              <button onClick={handleSubmitComment} disabled={!commentText.trim()} className="text-wedding-500 font-bold text-[11px] px-3 disabled:opacity-30 uppercase">Paylaş</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
