
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../types';
import { dbService } from '../services/db';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';

interface BlogPageProps {
  isAdmin: boolean;
}

export const BlogPage: React.FC<BlogPageProps> = ({ isAdmin }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null); // Düzenlenen yazının ID'si
  
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editBadge, setEditBadge] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reading Mode & Delete State
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setIsLoading(true);
    const data = await dbService.getAllBlogPosts();
    setPosts(data);
    setIsLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditor = (postToEdit?: BlogPost) => {
      if (postToEdit) {
          // Düzenleme Modu
          setEditingPostId(postToEdit.id);
          setEditTitle(postToEdit.title);
          setEditContent(postToEdit.content);
          setEditImage(postToEdit.coverImage);
          setEditIsFeatured(postToEdit.isFeatured || false);
          setEditBadge(postToEdit.badge || '');
      } else {
          // Yeni Ekleme Modu
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
        date: editingPostId ? (posts.find(p => p.id === editingPostId)?.date || Date.now()) : Date.now(), // Düzenlemede tarihi koru
        isFeatured: editIsFeatured,
        badge: editBadge.trim()
      };

      await dbService.saveBlogPost(newPost);
      await loadBlogPosts();
      setIsEditorOpen(false);
      resetForm();
    } catch (error) {
      alert("Blog yazısı kaydedilirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Silme işlemini başlatan fonksiyon (sadece ID set eder)
  const requestDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Kartın açılmasını engelle
    setPostToDelete(id);
  };

  // Gerçek silme işlemini yapan fonksiyon
  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
        // Optimistic UI: Listeden hemen kaldır
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        
        // Okuma modu açıksa ve silinen post ise kapat
        if (selectedPost?.id === postToDelete) setSelectedPost(null);
        
        // DB'den sil
        await dbService.deleteBlogPost(postToDelete);
    } catch (error) {
        console.error("Silme hatası:", error);
        alert("Silme işlemi sırasında bir hata oluştu.");
        loadBlogPosts(); // Hata varsa geri yükle
    } finally {
        setPostToDelete(null); // Modalı kapat
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

  // Find Featured Post (Usually the most recent one marked as featured)
  const featuredPost = posts.find(p => p.isFeatured);
  const gridPosts = posts.filter(p => p.id !== featuredPost?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn relative pb-24">
      
      {/* Header Section */}
      <div className="text-center mb-10 relative">
        <span className="text-wedding-500 font-bold tracking-widest text-xs uppercase mb-2 block">Düğün Rehberi</span>
        <h2 className="text-4xl md:text-5xl font-serif font-medium text-gray-900 mb-6">Annabella Blog</h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
          Gelinlik trendleri, düğün planlama ipuçları ve ilham verici gerçek düğün hikayeleri.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-500"></div>
        </div>
      ) : (
        <>
            {/* FEATURED POST (HERO SECTION) */}
            {featuredPost && (
                <div 
                    onClick={() => setSelectedPost(featuredPost)}
                    className="mb-16 rounded-3xl overflow-hidden shadow-2xl relative aspect-[16/9] md:aspect-[21/9] group cursor-pointer"
                >
                    <img 
                        src={featuredPost.coverImage} 
                        alt={featuredPost.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                        <div className="max-w-3xl animate-float-up">
                            {featuredPost.badge && (
                                <span className="bg-wedding-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 inline-block shadow-lg">
                                    {featuredPost.badge}
                                </span>
                            )}
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight shadow-black drop-shadow-lg">
                                {featuredPost.title}
                            </h2>
                            <p className="text-gray-200 text-base md:text-lg line-clamp-2 md:line-clamp-3 mb-6 font-light">
                                {featuredPost.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-white/80 text-sm font-medium border-r border-white/30 pr-4">
                                    {new Date(featuredPost.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <button 
                                    className="text-white font-bold text-sm uppercase tracking-wide hover:underline decoration-wedding-500 decoration-2 underline-offset-4"
                                    onClick={(e) => { e.stopPropagation(); setSelectedPost(featuredPost); }}
                                >
                                    Haberi Oku &rarr;
                                </button>
                                
                                {isAdmin && (
                                    <div className="ml-auto flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleOpenEditor(featuredPost); }}
                                            className="bg-white/20 hover:bg-blue-500 hover:text-white text-white p-2 rounded-full backdrop-blur-md transition-colors z-20"
                                            title="Düzenle"
                                        >
                                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => requestDelete(featuredPost.id, e)}
                                            className="bg-white/20 hover:bg-red-500 hover:text-white text-white p-2 rounded-full backdrop-blur-md transition-colors z-20"
                                            title="Sil"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GRID SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {gridPosts.map((post) => (
                <article 
                    key={post.id} 
                    className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                >
                <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                            {new Date(post.date).toLocaleDateString('tr-TR')}
                        </div>
                        {post.badge && (
                             <div className="bg-wedding-500 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm uppercase">
                                {post.badge}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-3 group-hover:text-wedding-500 transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                    <div className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1 whitespace-pre-line">
                        {post.content}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <button 
                        onClick={(e) => {
                             e.stopPropagation();
                             setSelectedPost(post);
                        }}
                        className="text-wedding-500 font-bold text-sm flex items-center gap-1 group/btn hover:text-wedding-900 transition-colors"
                    >
                        Devamını Oku 
                        <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                    
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenEditor(post); }}
                                className="text-blue-400 hover:text-blue-600 p-2 z-10 hover:bg-blue-50 rounded-full transition-colors"
                                title="Düzenle"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => requestDelete(post.id, e)}
                                className="text-red-400 hover:text-red-600 p-2 z-10 hover:bg-red-50 rounded-full transition-colors"
                                title="Sil"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    )}
                    </div>
                </div>
                </article>
            ))}
            {posts.length === 0 && (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl">
                <p className="text-gray-400 font-serif text-xl">Henüz blog yazısı eklenmemiş.</p>
                </div>
            )}
            </div>
        </>
      )}

      {/* ADMIN FLOATING ACTION BUTTON (New Post) */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40">
            <button 
                onClick={() => handleOpenEditor()}
                className="bg-wedding-500 hover:bg-wedding-900 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl shadow-wedding-500/30 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
                title="Yeni Blog Yazısı Ekle"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
      )}

      {/* READING MODE MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
             {/* Sticky Navigation */}
             <div className="sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 h-16 flex items-center justify-between z-10">
                 <button 
                    onClick={() => setSelectedPost(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-wedding-500 transition-colors font-medium text-sm"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Blog'a Dön
                 </button>
                 <span className="font-serif font-bold text-gray-900 hidden sm:block truncate max-w-xs">{selectedPost.title}</span>
                 <div className="w-8"></div> {/* Spacer for balance */}
             </div>

             {/* Content */}
             <div className="max-w-4xl mx-auto pb-20">
                <div className="w-full aspect-video md:aspect-[21/9] relative">
                    <img src={selectedPost.coverImage} className="w-full h-full object-cover" alt={selectedPost.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>

                <div className="px-4 sm:px-8 md:px-12 -mt-20 relative">
                     <div className="bg-white rounded-t-3xl p-6 md:p-10 shadow-sm border border-gray-50">
                        {selectedPost.badge && (
                            <span className="text-wedding-500 font-bold tracking-widest text-xs uppercase mb-4 block">
                                {selectedPost.badge}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                            {selectedPost.title}
                        </h1>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-wedding-100 flex items-center justify-center text-wedding-700 font-bold font-serif">A</div>
                                <span>{selectedPost.author}</span>
                             </div>
                             <span>•</span>
                             <span>{new Date(selectedPost.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric'})}</span>
                        </div>

                        <div className="prose prose-lg prose-wedding max-w-none text-gray-700 leading-relaxed whitespace-pre-line font-serif">
                            {selectedPost.content}
                        </div>
                     </div>
                </div>
             </div>
        </div>
      )}

      {/* Confirmation Modal (Custom Delete Alert) */}
      <ConfirmationModal 
        isOpen={!!postToDelete}
        title="Yazıyı Sil"
        message="Bu blog yazısını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setPostToDelete(null)}
      />

      {/* Admin Blog Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl font-bold">{editingPostId ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'}</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Featured & Badge Options */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-wedding-50 rounded-xl border border-wedding-100">
                  <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isFeatured"
                        className="w-5 h-5 text-wedding-500 rounded focus:ring-wedding-500 border-gray-300"
                        checked={editIsFeatured}
                        onChange={(e) => setEditIsFeatured(e.target.checked)}
                      />
                      <label htmlFor="isFeatured" className="font-bold text-gray-700 text-sm select-none cursor-pointer">
                          Vitrinde Göster (Büyük Kart)
                      </label>
                  </div>
                  <div className="flex-1">
                      <input 
                        type="text"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-wedding-500 outline-none"
                        placeholder="Etiket (Örn: Ayın Gelinliği, Editörün Seçimi)"
                        value={editBadge}
                        onChange={(e) => setEditBadge(e.target.value)}
                      />
                  </div>
              </div>

              {/* Image Upload */}
              <div 
                className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {editImage ? (
                  <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-500">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-medium">Kapak Görseli Seç</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Başlık</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-wedding-500 focus:border-wedding-500 outline-none"
                  placeholder="Yazı başlığı..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">İçerik</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-64 focus:ring-2 focus:ring-wedding-500 focus:border-wedding-500 outline-none resize-none"
                  placeholder="Yazı içeriği..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
               <Button variant="secondary" onClick={() => setIsEditorOpen(false)}>İptal</Button>
               <Button onClick={handleSave} disabled={isSaving || !editTitle || !editContent || !editImage} isLoading={isSaving}>
                 {isSaving ? 'Kaydediliyor...' : 'Yayınla'}
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
