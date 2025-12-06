
import { Post, BlogPost, ChatMessage, MediaItem } from '../types';
import { db, storage } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  limit,
  onSnapshot,
  addDoc
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  uploadString
} from "firebase/storage";

const POSTS_COLLECTION = 'posts';
const BLOG_COLLECTION = 'blog_posts';
const CHAT_COLLECTION = 'chat_messages';

// --- MOCK DATA ---
const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    user: { id: 'u1', name: 'Ayşe & Mehmet', avatar: 'https://ui-avatars.com/api/?name=Ayse+Mehmet&background=fecdd3&color=881337' },
    media: [{ url: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'image' }],
    caption: 'Hayatımızın en özel günü...',
    hashtags: ['#düğün', '#gelinlik', '#mutluluk'],
    likes: 124,
    comments: [],
    timestamp: Date.now(),
    isLikedByCurrentUser: false
  }
];

const checkDbConnection = () => {
  if (!db || !storage) {
    console.warn("Firebase bağlantısı yok!");
    throw new Error("Veritabanı bağlantısı yapılamadı.");
  }
  return { dbInstance: db, storageInstance: storage };
};

/**
 * SUPER ROBUST UPLOAD FUNCTION (V2.0)
 * Bu fonksiyon, React state içinde bozulan File nesnelerine güvenmek yerine
 * blob: URL'lerini fetch ederek taze ve saf bir Blob oluşturur.
 * "invalid-argument" hatasının kesin çözümüdür.
 */
const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    try {
        // 1. Durum: String (Base64 veya URL)
        if (typeof item === 'string') {
            if (item.startsWith('http')) return item; // Zaten link
            
            if (item.startsWith('data:')) {
                // Base64 yüklemesi
                console.log("Base64 yükleniyor...");
                const snapshot = await uploadString(storageRef, item, 'data_url');
                return await getDownloadURL(snapshot.ref);
            }
            
            if (item.startsWith('blob:')) {
                // Blob URL (Fetch et ve yükle - EN GÜVENLİ YOL)
                console.log("Blob URL'den taze blob oluşturuluyor...");
                const response = await fetch(item);
                const blob = await response.blob();
                const snapshot = await uploadBytes(storageRef, blob);
                return await getDownloadURL(snapshot.ref);
            }
        }

        // 2. Durum: MediaItem objesi (Feed Postları için)
        // Burada item.file'a güvenmek yerine item.url (blob:...) kullanıyoruz.
        // Çünkü item.file bazen React Proxy'sine dönüşüp Firebase'i bozabiliyor.
        const mediaItem = item as MediaItem;
        
        if (mediaItem.url && mediaItem.url.startsWith('blob:')) {
            console.log("MediaItem Blob URL tespit edildi, fetch ediliyor...", mediaItem.url);
            const response = await fetch(mediaItem.url);
            const blob = await response.blob();
            
            // İçeriğin tipini (mime type) belirle
            const metadata = {
                contentType: blob.type || mediaItem.mimeType || 'image/jpeg'
            };
            
            const snapshot = await uploadBytes(storageRef, blob, metadata);
            return await getDownloadURL(snapshot.ref);
        }

        // 3. Durum: Son çare olarak File nesnesini dene (Eğer blob url yoksa)
        if (mediaItem.file) {
            console.log("Direkt File nesnesi yükleniyor...");
            const snapshot = await uploadBytes(storageRef, mediaItem.file);
            return await getDownloadURL(snapshot.ref);
        }

        throw new Error("Yüklenecek geçerli bir veri bulunamadı.");

    } catch (error: any) {
        console.error("Upload Hatası:", error);
        if (error.code === 'storage/invalid-argument') {
            throw new Error("Dosya formatı bozuk (invalid-argument). Lütfen sayfayı yenileyip tekrar deneyin.");
        }
        throw error;
    }
};


export const dbService = {
  // --- FEED (POSTS) ---
  getAllPosts: async (): Promise<Post[]> => {
    try {
      if (!db) return MOCK_POSTS; 
      const postsRef = collection(db, POSTS_COLLECTION);
      const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => posts.push(doc.data() as Post));
      return posts.length > 0 ? posts : MOCK_POSTS;
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      return MOCK_POSTS;
    }
  },

  savePost: async (post: Post): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();

      // Medyaları yükle
      const updatedMedia = await Promise.all(post.media.map(async (item, index) => {
        const path = `posts/${post.id}/media_${index}_${Date.now()}`;
        
        // Yeni upload fonksiyonunu kullan
        const downloadURL = await uploadMediaItem(item, path);
        
        // Kaydettikten sonra dosya referanslarını temizle
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, ...rest } = item; 
        return { ...rest, url: downloadURL };
      }));

      const postToSave = { ...post, media: updatedMedia };
      await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), postToSave);
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
    // Blog görseli bir string (base64 veya url) olarak gelir
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
