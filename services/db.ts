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
  getDownloadURL
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
 * DÜZELTME V5: Blob kullanarak yükleme (En güvenilir yöntem)
 * Base64 ve URL sorunlarını çözmek için direkt Blob kullanıyoruz
 */
const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    try {
        console.log("Yükleme başlatılıyor:", path);

        console.log("🔍 Gelen item:", item);
        console.log("🔍 Item tipi:", typeof item);
        if (typeof item !== 'string') {
            console.log("🔍 MediaItem.file:", (item as MediaItem).file);
            console.log("🔍 MediaItem.url:", (item as MediaItem).url);
        }

        // 1. Durum: Direkt String (HTTP/HTTPS URL)
        if (typeof item === 'string') {
            if (item.startsWith('http://') || item.startsWith('https://')) {
                console.log("Zaten yüklenmiş URL, atlaniyor");
                return item;
            }
            
            // Blob URL ise fetch ile çek
            if (item.startsWith('blob:')) {
                console.log("Blob URL tespit edildi, dönüştürülüyor...");
                const response = await fetch(item);
                const blob = await response.blob();
                
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log("✅ Yükleme başarılı:", downloadURL);
                return downloadURL;
            }
            
            // Base64 ise Blob'a çevir
            if (item.startsWith('data:')) {
                console.log("Base64 tespit edildi, Blob'a dönüştürülüyor...");
                const blob = await dataURLtoBlob(item);
                
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log("✅ Yükleme başarılı:", downloadURL);
                return downloadURL;
            }
            
            throw new Error("Desteklenmeyen string formatı");
        } 
        
        // 2. Durum: MediaItem objesi
        const mediaItem = item as MediaItem;
        
        // Önce file objesini kontrol et
        if (mediaItem.file) {
            console.log("File objesi bulundu, doğrudan yükleniyor...");
            const snapshot = await uploadBytes(storageRef, mediaItem.file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log("✅ Yükleme başarılı:", downloadURL);
            return downloadURL;
        }
        
        // URL varsa kontrol et
        if (mediaItem.url) {
            // HTTP/HTTPS URL
            if (mediaItem.url.startsWith('http://') || mediaItem.url.startsWith('https://')) {
                console.log("Zaten yüklenmiş URL, atlanıyor");
                return mediaItem.url;
            }
            
            // Blob URL
            if (mediaItem.url.startsWith('blob:')) {
                console.log("MediaItem'da Blob URL tespit edildi...");
                const response = await fetch(mediaItem.url);
                const blob = await response.blob();
                
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log("✅ Yükleme başarılı:", downloadURL);
                return downloadURL;
            }
            
            // Base64 data URL
            if (mediaItem.url.startsWith('data:')) {
                console.log("MediaItem'da Base64 tespit edildi...");
                const blob = await dataURLtoBlob(mediaItem.url);
                
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log("✅ Yükleme başarılı:", downloadURL);
                return downloadURL;
            }
            
            throw new Error("MediaItem URL'i desteklenmeyen bir formatta");
        }
        
        throw new Error("MediaItem içinde ne file ne de url bulunamadı");

    } catch (error: any) {
        console.error("❌ Upload Hatası:", error);
        console.error("Hata detayları:", {
            code: error.code,
            message: error.message,
            path: path
        });
        
        if (error.code === 'storage/invalid-argument') {
            throw new Error("Dosya formatı hatası. Lütfen geçerli bir resim seçin.");
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

/**
 * Base64 Data URL'i Blob'a dönüştürür
 */
const dataURLtoBlob = async (dataURL: string): Promise<Blob> => {
    try {
        const response = await fetch(dataURL);
        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error("Base64 -> Blob dönüşüm hatası:", error);
        throw new Error("Resim formatı dönüştürülemedi");
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

      console.log("📤 Post kaydediliyor, medya sayısı:", post.media.length);

      // Medyaları sırayla yükle
      const updatedMedia = [];
      for (let index = 0; index < post.media.length; index++) {
        const item = post.media[index];
        const path = `posts/${post.id}/media_${index}_${Date.now()}`;
        
        console.log(`📸 Medya ${index + 1}/${post.media.length} yükleniyor...`);
        const downloadURL = await uploadMediaItem(item, path);
        
        // Dosya referanslarını temizle
        const { file, ...rest } = item; 
        updatedMedia.push({ ...rest, url: downloadURL });
      }

      const postToSave = { ...post, media: updatedMedia };
      await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), postToSave);
      console.log("✅ Post başarıyla kaydedildi!");
    } catch (error) {
      console.error("❌ Post kayıt hatası:", error);
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