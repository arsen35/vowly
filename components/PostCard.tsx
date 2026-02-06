
import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../types';
import { dbService } from '../services/db';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDelete: (postId: string) => void;
  isAdmin: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUserClick?: (user: User) => void;
  currentUserId?: string;
}

interface HeartParticle {
  id: number;
  x: number; 
  y: number;
  size: number;
  color: string;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onAddComment, 
  onDelete, 
  isAdmin, 
  isFollowing, 
  onFollow,
  onUserClick,
  currentUserId 
}) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [isIconPulsing, setIsIconPulsing] = useState(false);

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

  const triggerParticles = () => {
    const colors = ['#A66D60', '#D0B2A8', '#E4D2CC', '#F1E8E5'];
    const newParticles: HeartParticle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: Math.random(),
        x: (Math.random() - 0.5) * 60,
        y: -(Math.random() * 40 + 20),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);
  };

  const handleLike = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    if (newLikedState) {
      triggerParticles();
      setIsIconPulsing(true);
      setTimeout(() => setIsIconPulsing(false), 400);
    }
    
    onLike(post.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBigHeart(true);
    setTimeout(() => setShowBigHeart(false), 1000);
    if (!isLiked) {
      handleLike();
    } else {
      triggerParticles();
    }
  };

  const handleShare = () => {
    const message = `Annabella Bridal'da bu gelinliği gördün mü? ✨\n\n"${post.caption}"\n\nKeşfet: https://annabellabridal.com`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const isOwnPost = currentUserId === post.user.id;

  return (
    <div className="bg-white dark:bg-theme-black border border-gray-100 dark:border-zinc-900 overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-sm rounded-lg">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50 dark:border-zinc-900">
        <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onUserClick?.(post.user)}
        >
          <div className="w-9 h-9 rounded-md overflow-hidden border border-gray-100 dark:border-zinc-800 transition-transform group-hover:scale-105">
            <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-900 dark:text-white text-[13px] tracking-tight leading-none group-hover:text-wedding-500 transition-colors">{post.user.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isOwnPost && (
            <button 
              onClick={(e) => { e.stopPropagation(); onFollow?.(); }}
              className={`text-[9px] font-bold px-3 py-1.5 rounded-md border transition-all ${isFollowing ? 'text-gray-400 bg-transparent border-gray-100 dark:border-zinc-800' : 'text-gray-900 bg-transparent border-gray-200 hover:border-wedding-500 hover:text-wedding-500 dark:text-white dark:border-zinc-800'}`}
            >
              {isFollowing ? 'Takiptesin' : 'Takip Et'}
            </button>
          )}
          
          {isAdmin && (
              <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-gray-600 p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                  </button>
                  {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-zinc-900 rounded-md shadow-xl border border-gray-100 dark:border-zinc-800 z-50 py-1">
                          <button onClick={() => { setIsMenuOpen(false); onDelete(post.id); }} className="w-full text-left px-4 py-3 text-[9px] text-red-600 font-bold uppercase tracking-wider hover:bg-red-50">Sil</button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>

      <div 
        className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-zinc-950 group overflow-hidden select-none"
        onDoubleClick={handleDoubleClick}
      >
        {showBigHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-like-pop">
                <div className="relative">
                    {/* Arka plan ışıltısı */}
                    <div className="absolute inset-0 blur-2xl bg-wedding-500/30 scale-150 rounded-full"></div>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32 text-wedding-500/90 drop-shadow-[0_10px_40px_rgba(166,109,96,0.8)] relative z-10">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                </div>
            </div>
        )}
        <img src={post.media[0].url} alt="Post" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" loading="lazy" />
        
        {post.location && (
            <div className="absolute top-4 left-4 z-10 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
                <span className="text-[9px] text-white font-medium flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    {post.location}
                </span>
            </div>
        )}
      </div>
      
      {post.productUrl && (
          <a 
            href={post.productUrl} 
            target="_blank" 
            className="w-full px-4 py-3.5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-[0.15em] transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 group/btn rounded-none"
          >
              <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 group-hover/btn:text-gray-900 dark:group-hover/btn:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                  Ürünü İncele
              </div>
              <svg className="w-3.5 h-3.5 text-gray-300 group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </a>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 relative">
                {/* Partiküller */}
                {particles.map(p => (
                  <div 
                    key={p.id}
                    className="absolute pointer-events-none animate-float-up z-20"
                    style={{ left: `calc(50% + ${p.x}px)`, top: '0px' }}
                  >
                    <svg viewBox="0 0 24 24" fill={p.color} style={{ width: p.size, height: p.size }}>
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </div>
                ))}

                <button 
                  onClick={handleLike} 
                  className={`transition-all duration-300 active:scale-75 ${isLiked ? 'text-wedding-500' : 'text-gray-900 dark:text-white hover:text-wedding-500'} ${isIconPulsing ? 'animate-icon-pulse' : ''}`}
                >
                  <svg fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
                <span className="text-[13px] font-bold">{likesCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <button onClick={() => setIsCommentOpen(!isCommentOpen)} className="text-gray-900 dark:text-white hover:text-wedding-500 transition-all">
                   <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7">
                    <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                </button>
                <span className="text-[13px] font-bold">{post.comments.length}</span>
            </div>
            <button onClick={handleShare} className="text-gray-900 dark:text-white hover:text-wedding-500 transition-all">
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7 -rotate-12">
                 <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
               </svg>
            </button>
          </div>
        </div>
        <div className="text-[13px] mb-3 leading-relaxed">
          <span 
            className="font-bold mr-2 text-gray-900 dark:text-white cursor-pointer hover:text-wedding-500 transition-colors"
            onClick={() => onUserClick?.(post.user)}
          >
            {post.user.name}
          </span>
          <span className="text-gray-600 dark:text-gray-400 font-normal">{post.caption}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="text-gray-400 dark:text-zinc-500 text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-zinc-800 px-2 py-0.5 rounded-md hover:border-gray-400 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">#{tag.replace('#', '')}</span>
          ))}
        </div>
        {isCommentOpen && (
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-md p-3 mt-4 border border-gray-100 dark:border-zinc-800 animate-fadeIn">
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
               {post.comments.map((comment) => (
                 <div key={comment.id} className="text-[11px] pb-1.5 border-b border-gray-200/20 dark:border-zinc-800/20 last:border-0">
                    <span 
                        className="font-bold mr-2 text-gray-900 dark:text-white cursor-pointer hover:text-wedding-500 transition-colors"
                        onClick={() => dbService.getUser(comment.userId).then(u => u && onUserClick?.(u))}
                    >
                        {comment.userName}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{comment.text}</span>
                 </div>
               ))}
               {post.comments.length === 0 && <p className="text-[10px] text-gray-400 font-normal text-center py-2">Henüz yorum yapılmamış ✨</p>}
            </div>
            <div className="flex gap-2 items-center bg-white dark:bg-theme-black rounded-md px-2 py-2 ring-1 ring-gray-100 dark:ring-zinc-800">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()} placeholder="Düşünceni paylaş..." className="flex-1 bg-transparent px-1 text-xs outline-none dark:text-white" />
              <button onClick={handleSubmitComment} disabled={!commentText.trim()} className="text-gray-900 dark:text-white font-bold text-[10px] px-2 uppercase tracking-widest disabled:opacity-30">Paylaş</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
