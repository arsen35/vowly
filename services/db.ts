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
 * DÜZELTME DETAYLARI:
 * 1. Base64 string'in doğru formatını kontrol ediyoruz
 * 2. Data URL prefix'ini doğru şekilde ayıklıyoruz
 * 3. Blob URL'leri için fetch ile veri çekme eklendi
 * 4. Daha iyi hata yönetimi
 */
const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    try {
        let base64Data = "";

        // 1. Durum: Direkt String
        if (typeof item === 'string') {
            // Zaten bir URL ise (http/https)
            if (item.startsWith('http://') || item.startsWith('https://')) {
                return item;
            }
            
            // Blob URL ise, fetch ile veriyi çekelim
            if (item.startsWith('blob:')) {
                console.log("Blob URL tespit edildi, dönüştürülüyor...");
                const response = await fetch(item);
                const blob = await response.blob();
                
                // Blob'u File gibi yükle
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return downloadURL;
            }
            
            // Base64 string ise
            if (item.startsWith('data:')) {
                base64Data = item;
            } else {
                throw new Error("Geçersiz string formatı");
            }
        } 
        // 2. Durum: MediaItem objesi
        else {
            const mediaItem = item as MediaItem;
            
            // Önce file objesini kontrol et
            if (mediaItem.file) {
                console.log("File objesi bulundu, doğrudan yükleniyor...");
                const snapshot = await uploadBytes(storageRef, mediaItem.file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return downloadURL;
            }
            
            // URL varsa kontrol et
            if (mediaItem.url) {
                // HTTP/HTTPS URL
                if (mediaItem.url.startsWith('http://') || mediaItem.url.startsWith('https://')) {
                    return mediaItem.url;
                }
                
                // Blob URL
                if (mediaItem.url.startsWith('blob:')) {
                    console.log("MediaItem'da Blob URL tespit edildi, dönüştürülüyor...");
                    const response = await fetch(mediaItem.url);
                    const blob = await response.blob();
                    const snapshot = await uploadBytes(storageRef, blob);
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    return downloadURL;
                }
                
                // Base64 data URL
                if (mediaItem.url.startsWith('data:')) {
                    base64Data = mediaItem.url;
                } else {
                    throw new Error("MediaItem URL'i desteklenmeyen bir formatta");
                }
            } else {
                throw new Error("MediaItem içinde ne file ne de url bulunamadı");
            }
        }

        // Base64 yükleme
        if (!base64Data) {
            throw new Error("Yüklenecek veri bulunamadı");
        }

        // Base64 formatını kontrol et ve temizle
        if (!base64Data.startsWith('data:')) {
            throw new Error("Geçerli bir Base64 data URL değil");
        }

        console.log("Firebase'e Base64 olarak yükleniyor...");
        
        // uploadString kullanarak yükle
        const snapshot = await uploadString(storageRef, base64Data, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log("Yükleme başarılı:", downloadURL);
        return downloadURL;

    } catch (error: any) {
        console.error("Upload Hatası (db.ts):", error);
        console.error("Hata detayları:", {
            code: error.code,
            message: error.message,
            path: path
        });
        
        // Spesifik hata mesajları
        if (error.code === 'storage/invalid-argument') {
            throw new Error("Dosya formatı hatası. Lütfen geçerli bir resim seçin ve tekrar deneyin.");
        }
        if (error.code === 'storage/unauthorized') {
            throw new Error("Yükleme izniniz yok. Firebase Storage kurallarını kontrol edin.");
        }
        if (error.code === 'storage/canceled') {
            throw new Error("Yükleme iptal edildi.");
        }
        if (error.code === 'storage/unknown') {
            throw new Error("Bilinmeyen bir hata oluştu. İnternet bağlantınızı kontrol edin.");
        }
        
        throw new Error(`Dosya yükleme hatası: ${error.message}`);
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

      console.log("Post kaydediliyor, medya sayısı:", post.media.length);

      // Medyaları sırayla yükle (paralel yerine)
      const updatedMedia = [];
      for (let index = 0; index < post.media.length; index++) {
        const item = post.media[index];
        const path = `posts/${post.id}/media_${index}_${Date.now()}`;
        
        console.log(`Medya ${index + 1}/${post.media.length} yükleniyor...`);
        const downloadURL = await uploadMediaItem(item, path);
        
        // Dosya referanslarını temizle
        const { file, ...rest } = item; 
        updatedMedia.push({ ...rest, url: downloadURL });
      }

      const postToSave = { ...post, media: updatedMedia };
      await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), postToSave);
      console.log("Post başarıyla kaydedildi!");
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