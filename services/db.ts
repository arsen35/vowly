
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
 * UPLOAD FUNCTION V4 (BASE64 ONLY)
 * "Invalid-argument" hatasını çözmek için en garantili yöntem:
 * 1. UploadModal dosyayı zaten Base64 string'e çevirmiş oluyor.
 * 2. Burada sadece `uploadString` kullanıyoruz.
 * 3. File veya Blob objeleriyle uğraşmıyoruz.
 */
const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    try {
        let base64Data = "";

        // 1. Durum: Direkt String (Örn: Chat ekranından veya Base64 string)
        if (typeof item === 'string') {
            if (item.startsWith('http')) return item; // Zaten link
            base64Data = item;
        } 
        // 2. Durum: MediaItem objesi (Feed ekranından)
        else {
             const mediaItem = item as MediaItem;
             // V4 mantığı: UploadModal artık "url" alanına Base64 verisini koyuyor.
             // File objesine bakmamıza gerek yok, çünkü o "Proxy" olup bozulmuş olabilir.
             // Base64 string ise her zaman sağlamdır.
             if (mediaItem.url && mediaItem.url.startsWith('data:')) {
                 base64Data = mediaItem.url;
             } else {
                 console.warn("MediaItem içinde geçerli Base64 verisi bulunamadı, mevcut URL kullanılıyor:", mediaItem.url);
                 // Eğer blob URL ise ve hala geçerliyse şansımızı deneyebiliriz ama v4'te buna ihtiyacımız olmamalı
                 return mediaItem.url;
             }
        }

        if (!base64Data.startsWith('data:')) {
            throw new Error("Yüklenecek veri geçerli bir resim formatında (Base64) değil.");
        }

        console.log(`Firebase'e yükleniyor (Base64)...`);
        
        // uploadString en güvenilir yöntemdir
        const snapshot = await uploadString(storageRef, base64Data, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;

    } catch (error: any) {
        console.error("Upload Hatası (db.ts):", error);
        
        if (error.code === 'storage/invalid-argument') {
            throw new Error("Dosya formatı hatası. Lütfen sayfayı yenileyip tekrar deneyin.");
        }
        if (error.code === 'storage/unauthorized') {
            throw new Error("Yükleme izniniz yok. Lütfen sayfayı yenileyip tekrar deneyin.");
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
        
        // V4 Upload (Base64)
        const downloadURL = await uploadMediaItem(item, path);
        
        // Dosya referanslarını temizle
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
    // Blog görseli string veya file olabilir, uploadMediaItem halleder
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
