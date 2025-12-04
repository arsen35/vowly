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
  x: number; // Random horizontal offset
  delay: number; // Random delay
  color: string; // Slight variation in pink/red
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onAddComment, onDelete, isAdmin }) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Floating Hearts State
  const [hearts, setHearts] = useState<Heart[]>([]);

  // Touch state for swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const triggerHearts = () => {
    const newHearts: Heart[] = [];
    // Spawn 5-6 hearts
    for (let i = 0; i < 6; i++) {
      newHearts.push({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 40, // -20px to +20px horizontal drift
        delay: Math.random() * 0.3,
        color: Math.random() > 0.5 ? '#f43f5e' : '#e11d48' // rose-500 or rose-600
      });
    }
    setHearts(prev => [...prev, ...newHearts]);

    // Cleanup hearts after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 1200);
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    if (newLikedState) {
      triggerHearts();
    }
    
    onLike(post.id);
  };

  const handleShare = () => {
    // WhatsApp paylaşım mantığı (ilk görseli kullan)
    const currentMedia = post.media[0];
    const mediaLink = currentMedia.url.startsWith('http') ? `\n\nMedya Linki: ${currentMedia.url}` : '';
    
    let siteLink = window.location.href;
    if (siteLink.startsWith('blob:') || siteLink.includes('localhost') || siteLink.includes('content.goog')) {
        siteLink = "https://vowly.myshopify.com";
    }
    
    const message = `Vowly'de bu ana bak! 💍\n\n"${post.caption}"\n${mediaLink}\n\nDaha fazlası için Vowly'i ziyaret et: ${siteLink}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(post.id);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    
    // Herkes yorum yapabilir
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div className="bg-white sm:rounded-xl shadow-sm border-y sm:border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 flex items-center gap-3 border-b border-gray-50 relative">
        <img 
          src={post.user.avatar} 
          alt={post.user.name} 
          className="w-8 h-8 rounded-full object-cover border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{post.user.name}</h3>
          <p className="text-xs text-gray-500 truncate">{new Date(post.timestamp).toLocaleDateString('tr-TR')}</p>
        </div>
        
        {/* Three Dots Menu for Admin */}
        {isAdmin && (
            <div className="relative" ref={menuRef}>
                <button 
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={handleDelete}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Sil
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Carousel Media Container with Smooth Slide Transition */}
      <div 
        className="relative w-full aspect-[4/5] bg-gray-100 group touch-pan-y overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
            className="flex w-full h-full transition-transform duration-500 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
        >
            {post.media.map((media, index) => (
                <div key={index} className="w-full h-full flex-shrink-0 relative">
                    {media.type === 'video' ? (
                        <video 
                          src={media.url} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                    ) : (
                        <img 
                          src={media.url} 
                          alt={`Post media ${index + 1}`} 
                          className="w-full h-full object-cover select-none pointer-events-none"
                          loading="lazy"
                          draggable={false}
                        />
                    )}
                </div>
            ))}
        </div>

        {/* Carousel Controls (Desktop Only - Mobile uses swipe) */}
        {post.media.length > 1 && (
          <>
            {/* Prev Button */}
            <button 
                onClick={prevSlide}
                className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg transition-all duration-200 hidden md:block z-10 ${
                    currentMediaIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            {/* Next Button */}
            <button 
                onClick={nextSlide}
                className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg transition-all duration-200 hidden md:block z-10 ${
                    currentMediaIndex === post.media.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-1.5 rounded-full bg-black/10 backdrop-blur-[2px]">
              {post.media.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                    idx === currentMediaIndex ? 'bg-white scale-125 w-2.5' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Multi-photo indicator (top right) */}
        {post.media.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md font-medium pointer-events-none z-10">
            {currentMediaIndex + 1}/{post.media.length}
          </div>
        )}
      </div>

      {/* Actions & Details */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* LIKE BUTTON WITH HEARTS */}
            <div className="relative">
                <button 
                  onClick={handleLike}
                  className={`relative z-10 transition-transform duration-200 active:scale-75 hover:scale-110 ${isLiked ? 'text-wedding-500' : 'text-gray-400 hover:text-wedding-500'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
                {/* Floating Hearts Container */}
                {hearts.map(heart => (
                    <span
                        key={heart.id}
                        className="absolute top-0 left-0 pointer-events-none animate-float-heart"
                        style={{
                            left: `${10 + heart.x}px`,
                            color: heart.color,
                            animationDelay: `${heart.delay}s`,
                            fontSize: '1.2rem'
                        }}
                    >
                        ❤️
                    </span>
                ))}
            </div>
            
            {/* COMMENT BUTTON */}
            <button 
              onClick={() => setIsCommentOpen(!isCommentOpen)}
              className={`relative transition-all duration-200 active:scale-90 hover:scale-110 ${isCommentOpen ? 'text-wedding-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              {/* Comment Badge */}
              {post.comments.length > 0 && !isCommentOpen && (
                  <span className="absolute -top-1 -right-1 bg-wedding-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {post.comments.length}
                  </span>
              )}
            </button>

            {/* WHATSAPP BUTTON */}
            <button onClick={handleShare} className="text-gray-400 hover:text-[#25D366] transition-all hover:scale-110 active:scale-90">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
               </svg>
            </button>
          </div>
          <div className="font-bold text-xs text-gray-900">{likesCount} beğenme</div>
        </div>
        
        <div className="text-gray-900 text-sm mb-2 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
          <span className="font-bold mr-1">{post.user.name}</span>
          {post.caption}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2 mt-auto">
          {post.hashtags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-wedding-500 hover:underline cursor-pointer text-[10px] font-medium bg-wedding-50 px-1.5 py-0.5 rounded">#{tag.replace('#', '')}</span>
          ))}
        </div>

        <button 
          onClick={() => setIsCommentOpen(!isCommentOpen)}
          className="text-gray-400 text-xs text-left hover:text-gray-600 transition-colors"
        >
          {post.comments.length > 0 ? `Tüm ${post.comments.length} yorumu gör` : 'Yorum ekle...'}
        </button>

        {/* Comments Section */}
        {isCommentOpen && (
          <div className="bg-gray-50 rounded-lg p-2 mt-2 border border-gray-100 animate-fadeIn">
            <div className="space-y-2 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
               {post.comments.map((comment) => (
                 <div key={comment.id} className="text-xs border-b border-gray-100 last:border-0 pb-1">
                    <span className="font-bold text-wedding-900 mr-1">{comment.userName}</span>
                    <span className="text-gray-700 break-words">{comment.text}</span>
                 </div>
               ))}
               {post.comments.length === 0 && <p className="text-gray-400 text-[10px] text-center italic">İlk yorumu sen yaz!</p>}
            </div>
            
            <div className="flex gap-1.5 items-center">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="Yorum..."
                className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-wedding-500 focus:ring-1 focus:ring-wedding-200"
              />
              <button 
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="text-wedding-500 font-bold text-xs disabled:opacity-50 hover:text-wedding-900"
              >
                Paylaş
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};