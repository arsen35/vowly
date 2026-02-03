
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../types';
import { dbService } from '../services/db';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';

interface BlogPageProps {
  isAdmin: boolean;
  onOpenLogin?: () => void; // Admin girişi için modalı tetiklemek üzere
}

export const BlogPage: React.FC<BlogPageProps> = ({ isAdmin, onOpenLogin }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editBadge, setEditBadge] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = dbService.subscribeToBlogPosts((data) => {
        setPosts(data);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setEditImage(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditor = (postToEdit?: BlogPost) => {
      if (postToEdit) {
          setEditingPostId(postToEdit.id);
          setEditTitle(postToEdit.title);
          setEditContent(postToEdit.content);
          setEditImage(postToEdit.coverImage);
          setEditIsFeatured(postToEdit.isFeatured || false);
          setEditBadge(postToEdit.badge || '');
      } else {
          resetForm();
      }
      setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editTitle || !editContent || !editImage) return;
    setIsSaving(true);
    try {
      const postId = editingPostId || Date.now().toString();
      const newPost: BlogPost = {
        id: postId,
        title: editTitle,
        content: editContent,
        coverImage: editImage,
        author: 'Annabella Editör',
        date: editingPostId ? (posts.find(p => p.id === editingPostId)?.date || Date.now()) : Date.now(),
        isFeatured: editIsFeatured,
        badge: editBadge.trim()
      };
      await dbService.saveBlogPost(newPost);
      setIsEditorOpen(false);
      resetForm();
    } catch (error) {
      alert("Blog yazısı kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPostToDelete(id);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
        await dbService.deleteBlogPost(postToDelete);
        if (selectedPost?.id === postToDelete) setSelectedPost(null);
    } catch (error) {
        alert("Silme işlemi sırasında bir hata oluştu.");
    } finally {
        setPostToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditImage(null);
    setEditIsFeatured(false);
    setEditBadge('');
  };

  const featuredPost = posts.find(p => p.isFeatured);
  const gridPosts = posts.filter(p => p.id !== featuredPost?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn relative pb-32">
      {/* Header Section */}
      <div className="text-center mb-10 relative">
        <span className="text-wedding-500 font-bold tracking-widest text-xs uppercase mb-2 block">Düğün Rehberi</span>
        <h2 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 dark:text-white mb-6">Annabella Blog</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed text-sm">
          Gelinlik trendleri, düğün planlama ipuçları ve ilham verici hikayeler.
        </p>

        {/* EĞER ADMİN DEĞİLSE HIZLI GİRİŞ BUTONU */}
        {!isAdmin && (
            <div className="mt-8">
                <button 
                    onClick={onOpenLogin}
                    className="text-[10px] text-gray-400 hover:text-wedding-500 underline underline-offset-4 tracking-widest uppercase transition-colors"
                >
                    İçerik Yönetmek İçin Giriş Yapın
                </button>
            </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-wedding-500"></div>
        </div>
      ) : (
        <>
            {/* Featured Post */}
            {featuredPost && (
                <div onClick={() => setSelectedPost(featuredPost)} className="mb-12 rounded-3xl overflow-hidden shadow-2xl relative aspect-[16/9] md:aspect-[21/9] group cursor-pointer border border-gray-100 dark:border-gray-800">
                    <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" />
                    
                    {/* ADMİN ARAÇLARI - Öne Çıkan Yazı İçin */}
                    {isAdmin && (
                        <div className="absolute top-6 right-6 z-20 flex gap-3">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEditor(featuredPost); }} className="bg-white hover:bg-wedding-50 p-3 rounded-full text-wedding-500 shadow-2xl transition-all transform hover:scale-110">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={(e) => requestDelete(featuredPost.id, e)} className="bg-white hover:bg-red-50 p-3 rounded-full text-red-500 shadow-2xl transition-all transform hover:scale-110">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-6 md:p-10">
                        <div className="max-w-3xl animate-float-up">
                            {featuredPost.badge && (
                                <span className="bg-wedding-500 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-3 inline-block shadow-lg">
                                    {featuredPost.badge}
                                </span>
                            )}
                            <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mb-3 leading-tight drop-shadow-lg">
                                {featuredPost.title}
                            </h2>
                            <p className="text-gray-200 text-sm md:text-base line-clamp-2 mb-4 font-light">
                                {featuredPost.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-white/80 text-xs font-medium border-r border-white/30 pr-4">
                                    {new Date(featuredPost.date).toLocaleDateString('tr-TR')}
                                </span>
                                <button className="text-white font-bold text-[10px] uppercase tracking-widest hover:underline decoration-wedding-500 underline-offset-4">
                                    Yazıyı Oku &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
                <article key={post.id} className="group flex flex-col h-full bg-white dark:bg-theme-dark rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 cursor-pointer" onClick={() => setSelectedPost(post)}>
                <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* ADMİN ARAÇLARI - Kartlar İçin */}
                    {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEditor(post); }} className="bg-white/95 backdrop-blur p-2 rounded-full text-blue-500 shadow-lg hover:bg-wedding-50 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={(e) => requestDelete(post.id, e)} className="bg-white/95 backdrop-blur p-2 rounded-full text-red-500 shadow-lg hover:bg-red-50 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    )}

                    <div className="absolute top-3 left-3 flex gap-2">
                        <div className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-900 shadow-sm">
                            {new Date(post.date).toLocaleDateString('tr-TR')}
                        </div>
                    </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2 group-hover:text-wedding-500 transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                    <div className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-4 line-clamp-3 flex-1 whitespace-pre-line font-serif">
                        {post.content}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800 mt-auto">
                    <button className="text-wedding-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 group/btn">
                        Devam Et <svg className="w-3 h-3 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                    </div>
                </div>
                </article>
            ))}
            </div>
            {posts.length === 0 && (
                <div className="text-center py-20 opacity-40">
                    <p className="font-serif italic text-lg dark:text-gray-300">Henüz bir blog yazısı bulunmuyor.</p>
                </div>
            )}
        </>
      )}

      {/* YÜZEN EKLEME BUTONU (FAB) - Sadece Adminler İçin */}
      {isAdmin && (
          <button 
            onClick={() => handleOpenEditor()}
            className="fixed bottom-24 right-8 md:bottom-12 md:right-12 z-50 bg-wedding-500 text-white p-5 rounded-full shadow-[0_10px_30px_rgba(166,109,96,0.5)] hover:bg-wedding-900 transition-all transform hover:scale-110 active:scale-95 group flex items-center gap-3 animate-bounce-slow"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-bold tracking-widest text-xs uppercase">Yazı Ekle</span>
          </button>
      )}

      {/* READING MODE MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-theme-dark overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
             <div className="sticky top-0 left-0 right-0 bg-white/80 dark:bg-theme-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 h-14 flex items-center justify-between z-10">
                 <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-gray-500 hover:text-wedding-500 transition-colors font-medium text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Geri Dön
                 </button>
                 <span className="font-serif font-bold text-gray-900 dark:text-white hidden sm:block truncate max-w-xs text-sm">{selectedPost.title}</span>
                 <div className="w-8"></div>
             </div>

             <div className="max-w-4xl mx-auto pb-20">
                <div className="w-full aspect-video md:aspect-[21/9] relative">
                    <img src={selectedPost.coverImage} className="w-full h-full object-cover" alt={selectedPost.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-theme-dark via-transparent to-transparent"></div>
                </div>
                <div className="px-4 sm:px-8 md:px-12 -mt-20 relative">
                     <div className="bg-white dark:bg-theme-dark rounded-t-3xl p-6 md:p-10 shadow-sm border border-gray-50 dark:border-gray-800">
                        <h1 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4 leading-tight">{selectedPost.title}</h1>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                             <span>{selectedPost.author}</span>
                             <span>•</span>
                             <span>{new Date(selectedPost.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-serif">
                            {selectedPost.content}
                        </div>
                     </div>
                </div>
             </div>
        </div>
      )}

      {/* Admin Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-theme-dark rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-theme-dark z-10">
              <h3 className="font-serif text-lg font-bold dark:text-white">{editingPostId ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'}</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-5 space-y-5 text-sm">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Yazı Başlığı</label>
                    <input type="text" className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 outline-none dark:text-white focus:ring-2 focus:ring-wedding-500/20 focus:border-wedding-500 font-serif text-lg" placeholder="Örn: 2025 Gelinlik Trendleri..." value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kapak Görseli</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all overflow-hidden relative group"
                    >
                        {editImage ? (
                            <>
                                <img src={editImage} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Değiştir</div>
                            </>
                        ) : (
                            <>
                                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-gray-400">Görsel Seç</span>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">İçerik Metni</label>
                    <textarea className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 h-48 outline-none dark:text-white resize-none focus:ring-2 focus:ring-wedding-500/20 focus:border-wedding-500 font-serif leading-relaxed" placeholder="Blog yazınızı buraya yazın..." value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                </div>

                <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-wedding-500 focus:ring-wedding-500" checked={editIsFeatured} onChange={(e) => setEditIsFeatured(e.target.checked)} />
                        <span className="font-medium dark:text-white">Öne Çıkan Yazı Yap</span>
                    </label>
                    <div className="flex-1">
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 outline-none dark:text-white" placeholder="Etiket (Örn: YENİ, TREND)..." value={editBadge} onChange={(e) => setEditBadge(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-theme-dark">
               <Button variant="secondary" onClick={() => setIsEditorOpen(false)}>İptal</Button>
               <Button onClick={handleSave} isLoading={isSaving} disabled={!editTitle || !editContent || !editImage}>
                   {editingPostId ? 'Değişiklikleri Kaydet' : 'Yazıyı Yayınla'}
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAYI MODALI */}
      <ConfirmationModal 
        isOpen={!!postToDelete}
        title="Blog Yazısını Sil"
        message="Bu blog yazısını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setPostToDelete(null)}
      />

      <style>{`
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
            50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};
