
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../types';
import { dbService } from '../services/db';
import { Button } from './Button';

interface BlogPageProps {
  isAdmin: boolean;
}

export const BlogPage: React.FC<BlogPageProps> = ({ isAdmin }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editBadge, setEditBadge] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    if (!editTitle || !editContent || !editImage) return;

    setIsSaving(true);
    try {
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: editTitle,
        content: editContent,
        coverImage: editImage,
        author: 'Vowly Editör',
        date: Date.now(),
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu yazıyı silmek istediğinize emin misiniz?")) {
      await dbService.deleteBlogPost(id);
      loadBlogPosts();
    }
  };

  const resetForm = () => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      
      {/* Header Section */}
      <div className="text-center mb-10 relative">
        <span className="text-wedding-500 font-bold tracking-widest text-xs uppercase mb-2 block">Düğün Rehberi</span>
        <h2 className="text-4xl md:text-5xl font-serif font-medium text-gray-900 mb-6">Vowly Blog</h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
          Gelinlik trendleri, düğün planlama ipuçları ve ilham verici gerçek düğün hikayeleri.
        </p>
        
        {isAdmin && (
          <div className="mt-8">
            <Button onClick={() => setIsEditorOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Yeni Yazı Ekle
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-500"></div>
        </div>
      ) : (
        <>
            {/* FEATURED POST (HERO SECTION) */}
            {featuredPost && (
                <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl relative aspect-[16/9] md:aspect-[21/9] group cursor-pointer">
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
                            <div className="flex items-center gap-4">
                                <span className="text-white/80 text-sm font-medium border-r border-white/30 pr-4">
                                    {new Date(featuredPost.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <button className="text-white font-bold text-sm uppercase tracking-wide hover:underline decoration-wedding-500 decoration-2 underline-offset-4">
                                    Haberi Oku &rarr;
                                </button>
                                {isAdmin && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(featuredPost.id); }}
                                        className="ml-auto bg-white/20 hover:bg-red-500 hover:text-white text-white p-2 rounded-full backdrop-blur-md transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GRID SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {gridPosts.map((post) => (
                <article key={post.id} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
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
                    <button className="text-wedding-500 font-bold text-sm flex items-center gap-1 group/btn">
                        Devamını Oku 
                        <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                    {isAdmin && (
                        <button 
                            onClick={() => handleDelete(post.id)}
                            className="text-red-400 hover:text-red-600 p-2"
                            title="Yazıyı Sil"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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

      {/* Admin Blog Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl font-bold">Yeni Blog Yazısı</h3>
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
