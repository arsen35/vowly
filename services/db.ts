
import { Post, BlogPost, ChatMessage, MediaItem } from '../types';
import { db, storage } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query, 
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  increment
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL
} from "firebase/storage";

const POSTS_COLLECTION = 'posts';
const BLOG_COLLECTION = 'blog_posts';
const CHAT_COLLECTION = 'chat_messages';

const checkDbConnection = () => {
  if (!db || !storage) {
    console.warn("Firebase bağlantısı yok!");
    throw new Error("Veritabanı bağlantısı yapılamadı.");
  }
  return { dbInstance: db, storageInstance: storage };
};

/**
 * Resmi optimize eder (boyut küçültme, format dönüştürme ve mobil uyumluluk)
 */
const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.naturalWidth || img.width;
                    let height = img.naturalHeight || img.height;
                    
                    const maxSize = 1920;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round((height / width) * maxSize);
                            width = maxSize;
                        } else {
                            width = Math.round((width / height) * maxSize);
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { alpha: false });
                    
                    if (!ctx) { reject(new Error('Canvas context hatası')); return; }
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Blob oluşturulamadı'));
                    }, 'image/jpeg', 0.85);
                } catch (error) { reject(error); }
            };
            img.onerror = (err) => reject(err);
            if (typeof e.target?.result === 'string') img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    try {
        if (typeof item === 'string') {
            if (item.startsWith('http')) return item;
            if (item.startsWith('blob:') || item.startsWith('data:')) {
                const response = await fetch(item);
                const blob = await response.blob();
                const snapshot = await uploadBytes(storageRef, blob);
                return await getDownloadURL(snapshot.ref);
            }
            throw new Error("Geçersiz format");
        } 
        
        const mediaItem = item as MediaItem;
        if (mediaItem.file) {
            try {
                const optimizedBlob = await optimizeImage(mediaItem.file);
                const snapshot = await uploadBytes(storageRef, optimizedBlob);
                return await getDownloadURL(snapshot.ref);
            } catch {
                const snapshot = await uploadBytes(storageRef, mediaItem.file);
                return await getDownloadURL(snapshot.ref);
            }
        }
        
        if (mediaItem.url) {
             const response = await fetch(mediaItem.url);
             const blob = await response.blob();
             const snapshot = await uploadBytes(storageRef, blob);
             return await getDownloadURL(snapshot.ref);
        }
        
        throw new Error("Dosya bulunamadı");
    } catch (error: any) {
        console.error("Upload Hatası:", error);
        throw error;
    }
};

export const dbService = {
  // --- FEED (POSTS) ---
  getAllPosts: async (): Promise<Post[]> => {
    try {
      if (!db) return []; 
      const postsRef = collection(db, POSTS_COLLECTION);
      const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => posts.push(doc.data() as Post));
      return posts;
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      return [];
    }
  },

  // Like sayısını güvenli şekilde artır/azalt (Atomic Increment)
  updateLikeCount: async (postId: string, incrementBy: number): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    const postRef = doc(dbInstance, POSTS_COLLECTION, postId);
    
    // increment(1) veya increment(-1) kullanarak veritabanındaki sayıyı güvenle günceller
    await updateDoc(postRef, {
        likes: increment(incrementBy)
    });
  },

  savePost: async (post: Post): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();
      const updatedMedia = [];
      
      for (let index = 0; index < post.media.length; index++) {
        const item = post.media[index];
        const path = `posts/${post.id}/media_${index}_${Date.now()}`;
        const downloadURL = await uploadMediaItem(item, path);
        const { file, ...rest } = item; 
        updatedMedia.push({ ...rest, url: downloadURL });
      }

      // Gereksiz alanları temizle
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isLikedByCurrentUser, ...postToSaveBase } = post;
      
      const cleanPost = { 
          ...postToSaveBase, 
          media: updatedMedia,
          likes: 0 // Yeni post her zaman 0 like ile başlar
      };
      
      Object.keys(cleanPost).forEach(key => {
        if (cleanPost[key as keyof typeof cleanPost] === undefined) {
          delete cleanPost[key as keyof typeof cleanPost];
        }
      });

      await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), cleanPost);
    } catch (error) {
      console.error("Post kayıt hatası:", error);
      throw error;
    }
  },

  deletePost: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, POSTS_COLLECTION, id));
  },

  // --- BLOG ---
  getAllBlogPosts: async (): Promise<BlogPost[]> => {
    if (!db) return [];
    const q = query(collection(db, BLOG_COLLECTION), orderBy("date", "desc"));
    const s = await getDocs(q);
    const p: BlogPost[] = [];
    s.forEach(d => p.push(d.data() as BlogPost));
    return p;
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    const path = `blog/${post.id}/cover_${Date.now()}`;
    const imageUrl = await uploadMediaItem(post.coverImage, path);
    const blogToSave = { ...post, coverImage: imageUrl };
    await setDoc(doc(dbInstance, BLOG_COLLECTION, post.id), blogToSave);
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, BLOG_COLLECTION, id));
  },

  // --- CHAT ---
  subscribeToChat: (callback: (messages: ChatMessage[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, CHAT_COLLECTION), orderBy("timestamp", "asc"), limit(100));
    return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => messages.push({ id: doc.id, ...doc.data() } as ChatMessage));
        callback(messages);
    });
  },

  sendChatMessage: async (message: Omit<ChatMessage, 'id'>) => {
    const { dbInstance } = checkDbConnection();
    let finalMessage = { ...message };
    if (message.image) {
         const path = `chat_images/${Date.now()}_img`;
         const imageUrl = await uploadMediaItem(message.image, path);
         finalMessage.image = imageUrl;
    }
    await addDoc(collection(dbInstance, CHAT_COLLECTION), finalMessage);
  },

  deleteChatMessage: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, CHAT_COLLECTION, id));
  },

  clearAll: async (): Promise<void> => {
    if (!db) return;
    const posts = await dbService.getAllPosts();
    await Promise.all(posts.map(p => deleteDoc(doc(db!, POSTS_COLLECTION, p.id))));
  },

  getStorageEstimate: async () => ({ usage: 0, quota: 0 })
};
