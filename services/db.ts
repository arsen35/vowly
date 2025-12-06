
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

// --- YARDIMCI: Dosyayı Güvenli Okuma (FileReader) ---
// Bu fonksiyon dosyayı tarayıcının belleğinde saf byte dizisine çevirir.
// React state'indeki "bozuk" file referanslarını temizlemenin en iyi yoludur.
const readFileAsArrayBuffer = (file: File | Blob): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            if (event.target?.result) {
                // ArrayBuffer -> Uint8Array dönüşümü
                const uint8Array = new Uint8Array(event.target.result as ArrayBuffer);
                resolve(uint8Array);
            } else {
                reject(new Error("Dosya okunamadı (Boş sonuç)."));
            }
        };
        
        reader.onerror = (error) => {
            reject(new Error("Dosya okuma hatası: " + error));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * UPLOAD FUNCTION V3 (FileReader Mode)
 * "invalid-argument" hatasının nihai çözümü.
 * React state'inden gelen dosya referansına güvenmek yerine,
 * veriyi byte byte okuyup Firebase'e öyle veriyoruz.
 */
const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    // Veri yoksa hata ver
    if (!item) throw new Error("Yüklenecek veri bulunamadı.");

    try {
        let dataToUpload: Uint8Array | null = null;
        let contentType = 'image/jpeg';

        // ---------------------------------------------------------
        // SENARYO 1: String (Base64 veya URL)
        // ---------------------------------------------------------
        if (typeof item === 'string') {
            // Zaten bir web linki ise yükleme yapma, linki döndür.
            if (item.startsWith('http')) return item;
            
            // Base64 ise
            if (item.startsWith('data:')) {
                const snapshot = await uploadString(storageRef, item, 'data_url');
                return await getDownloadURL(snapshot.ref);
            }
            
            // Blob URL ise (örn: blob:http://localhost...)
            if (item.startsWith('blob:')) {
                console.log("Blob URL tespit edildi, fetch yapılıyor...");
                const response = await fetch(item);
                const blob = await response.blob();
                dataToUpload = await readFileAsArrayBuffer(blob);
                contentType = blob.type || 'image/jpeg';
            }
        } 
        
        // ---------------------------------------------------------
        // SENARYO 2: MediaItem Objesi (Normal yükleme)
        // ---------------------------------------------------------
        else {
             const mediaItem = item as MediaItem;
             
             // 1. Öncelik: Gerçek Dosya (File Object)
             if (mediaItem.file) {
                 console.log("File nesnesi okunuyor (FileReader)...");
                 dataToUpload = await readFileAsArrayBuffer(mediaItem.file);
                 contentType = mediaItem.file.type || mediaItem.mimeType || 'image/jpeg';
             } 
             // 2. Öncelik: Blob URL
             else if (mediaItem.url && mediaItem.url.startsWith('blob:')) {
                 console.log("MediaItem içindeki Blob URL fetch ediliyor...");
                 const response = await fetch(mediaItem.url);
                 const blob = await response.blob();
                 dataToUpload = await readFileAsArrayBuffer(blob);
                 contentType = blob.type || 'image/jpeg';
             }
        }

        // ---------------------------------------------------------
        // YÜKLEME İŞLEMİ
        // ---------------------------------------------------------
        if (!dataToUpload) {
             throw new Error("Dosya verisi oluşturulamadı.");
        }

        console.log(`Firebase'e yükleniyor... Boyut: ${dataToUpload.length} bytes, Tip: ${contentType}`);
        
        // uploadBytes kullanırken contentType belirtmek önemlidir
        const snapshot = await uploadBytes(storageRef, dataToUpload, { contentType: contentType });
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;

    } catch (error: any) {
        console.error("Upload Hatası (db.ts):", error);
        
        if (error.code === 'storage/invalid-argument') {
            throw new Error("Firebase dosya formatını kabul etmedi. (V3 Fix)");
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
        
        // Yeni V3 upload fonksiyonunu kullan
        const downloadURL = await uploadMediaItem(item, path);
        
        // Kaydettikten sonra dosya referanslarını temizle, sadece URL kalsın
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
