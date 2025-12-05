
import { Post, BlogPost, ChatMessage } from '../types';
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
const MAX_CHAT_MESSAGES = 50;

// --- MOCK DATA (Demo Modu İçin) ---
const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    user: { id: 'u1', name: 'Ayşe & Mehmet', avatar: 'https://ui-avatars.com/api/?name=Ayse+Mehmet&background=fecdd3&color=881337' },
    media: [{ url: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'image' }],
    caption: 'Hayatımızın en özel günü... ✨ Bu gelinliği seçerken Annabella Bridal blogundaki yazılardan çok ilham aldım. #düğün #aşk',
    hashtags: ['#düğün', '#gelinlik', '#mutluluk'],
    likes: 124,
    comments: [
        { id: 'c1', userId: 'u3', userName: 'Zeynep', text: 'Harika görünüyorsunuz! 🌸', timestamp: Date.now() }
    ],
    timestamp: Date.now(),
    isLikedByCurrentUser: false
  },
  {
    id: 'mock-2',
    user: { id: 'u2', name: 'Selin Yılmaz', avatar: 'https://ui-avatars.com/api/?name=Selin+Yilmaz&background=e0f2fe&color=0369a1' },
    media: [{ url: 'https://images.unsplash.com/photo-1511285560982-1356c11d4606?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'image' }],
    caption: 'Detaylara aşık oldum! 👰‍♀️',
    hashtags: ['#annabellabridal', '#gelin', '#weddingdress'],
    likes: 89,
    comments: [],
    timestamp: Date.now() - 86400000,
    isLikedByCurrentUser: true
  }
];

// Yardımcı Fonksiyon: Veritabanı hazır mı kontrolü
const checkDbConnection = () => {
  if (!db || !storage) {
    console.warn("Firebase bağlantısı yok! İşlem gerçekleştirilemedi.");
    throw new Error("Veritabanı bağlantısı yapılamadı. Lütfen .env dosyasını kontrol edin.");
  }
  return { dbInstance: db, storageInstance: storage };
};

// GÜNCELLENMİŞ YÜKLEME FONKSİYONU
// Android/Mobile cihazlarda "invalid-argument" hatasını önlemek için
// Blob URL'leri (blob:http...) fetch ile indirip saf veri olarak yükler.
const uploadImageToStorage = async (input: File | Blob | string, path: string): Promise<string> => {
  const { storageInstance } = checkDbConnection();
  const storageRef = ref(storageInstance, path);
  
  try {
      // 1. Zaten uzak sunucudaysa (http/https), işlem yapma
      if (typeof input === 'string' && input.startsWith('http')) return input;

      let blobToUpload: Blob;

      if (typeof input === 'string') {
         if (input.startsWith('blob:')) {
            // CRITICAL FIX: Blob URL'yi fetch ile indir. 
            // Bu yöntem "File object lost" hatalarını çözer.
            const response = await fetch(input);
            blobToUpload = await response.blob();
         } else if (input.startsWith('data:')) {
            // Base64 ise uploadString kullan
            const snapshot = await uploadString(storageRef, input, 'data_url');
            return await getDownloadURL(snapshot.ref);
         } else {
             throw new Error("Bilinmeyen dosya formatı (String)");
         }
      } else {
         // File veya Blob objesi ise direkt kullan
         blobToUpload = input;
      }
      
      const snapshot = await uploadBytes(storageRef, blobToUpload);
      return await getDownloadURL(snapshot.ref);

  } catch (error: any) {
      console.error("Storage yükleme hatası:", error);
      throw new Error(`Resim yüklenemedi: ${error.message || 'Bilinmeyen Hata'}`);
  }
};

export const dbService = {
  // --- FEED (POSTS) ---

  getAllPosts: async (): Promise<Post[]> => {
    try {
      if (!db) {
          console.log("Firebase bağlı değil, Demo verileri gösteriliyor.");
          return MOCK_POSTS; 
      }
      
      const postsRef = collection(db, POSTS_COLLECTION);
      const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        posts.push(doc.data() as Post);
      });
      
      if (posts.length === 0) return MOCK_POSTS;

      return posts;
    } catch (error) {
      console.error("Firebase veri çekme hatası (Demo moduna geçiliyor):", error);
      return MOCK_POSTS;
    }
  },

  savePost: async (post: Post): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();

      // Medyaları Storage'a yükle
      const updatedMedia = await Promise.all(post.media.map(async (item, index) => {
        // Benzersiz dosya adı oluştur
        const path = `posts/${post.id}/media_${index}_${Date.now()}.webp`;
        
        // ÖNEMLİ: Eğer 'blob:' ile başlayan bir URL varsa onu kullanmaya zorla.
        // Çünkü fetch(blobUrl) yöntemi Android'de File objesinden daha güvenilirdir.
        const source = (item.url && item.url.startsWith('blob:')) ? item.url : (item.file || item.url);
        
        const downloadURL = await uploadImageToStorage(source, path);
        
        // Kaydettikten sonra 'file' nesnesini temizle (Firestore'a kaydedilmez) ve URL'i güncelle
        const { file, ...rest } = item;
        return { ...rest, url: downloadURL };
      }));

      const postToSave = { ...post, media: updatedMedia };
      await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), postToSave);

    } catch (error) {
      console.error("Post kayıt hatası detay:", error);
      throw error;
    }
  },

  deletePost: async (id: string): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();
      await deleteDoc(doc(dbInstance, POSTS_COLLECTION, id));
    } catch (error) {
      console.error("Silme hatası:", error);
      throw error;
    }
  },

  // --- BLOG ---

  getAllBlogPosts: async (): Promise<BlogPost[]> => {
    try {
      if (!db) return [];
      
      const blogRef = collection(db, BLOG_COLLECTION);
      const q = query(blogRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      
      const posts: BlogPost[] = [];
      querySnapshot.forEach((doc) => {
        posts.push(doc.data() as BlogPost);
      });
      return posts;
    } catch (error) {
      console.error("Blog verileri çekilemedi:", error);
      return [];
    }
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();
      
      const path = `blog/${post.id}/cover_${Date.now()}.webp`;
      const imageUrl = await uploadImageToStorage(post.coverImage, path);

      const blogToSave = { ...post, coverImage: imageUrl };
      await setDoc(doc(dbInstance, BLOG_COLLECTION, post.id), blogToSave);
    } catch (error) {
      console.error("Blog kayıt hatası:", error);
      throw error;
    }
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, BLOG_COLLECTION, id));
  },

  // --- CHAT (Canlı Sohbet) ---

  subscribeToChat: (callback: (messages: ChatMessage[]) => void) => {
    if (!db) return () => {};

    const chatRef = collection(db, CHAT_COLLECTION);
    const q = query(chatRef, orderBy("timestamp", "asc"), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages);
    });

    return unsubscribe;
  },

  sendChatMessage: async (message: Omit<ChatMessage, 'id'>) => {
    try {
        const { dbInstance } = checkDbConnection();
        const chatRef = collection(dbInstance, CHAT_COLLECTION);
        
        let finalMessage = { ...message };

        if (message.image) {
             const path = `chat_images/${Date.now()}_img.webp`;
             const imageUrl = await uploadImageToStorage(message.image, path);
             finalMessage.image = imageUrl;
        }

        await addDoc(chatRef, finalMessage);

        const q = query(chatRef, orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);

        if (snapshot.size > MAX_CHAT_MESSAGES) {
            const deleteCount = snapshot.size - MAX_CHAT_MESSAGES;
            const docsToDelete = snapshot.docs.slice(0, deleteCount);
            await Promise.all(docsToDelete.map(doc => deleteDoc(doc.ref)));
        }

    } catch (error) {
        console.error("Mesaj gönderme hatası:", error);
        throw error;
    }
  },

  deleteChatMessage: async (id: string): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();
      await deleteDoc(doc(dbInstance, CHAT_COLLECTION, id));
    } catch (error) {
      console.error("Mesaj silme hatası:", error);
      throw error;
    }
  },

  // --- GENEL ---

  clearAll: async (): Promise<void> => {
    try {
       if (!db) return;
       const posts = await dbService.getAllPosts();
       const deletePromises = posts.map(post => deleteDoc(doc(db!, POSTS_COLLECTION, post.id)));
       await Promise.all(deletePromises);
    } catch (error) {
       console.error("Toplu silme hatası:", error);
       throw error;
    }
  },

  getStorageEstimate: async (): Promise<{ usage: number; quota: number }> => {
    return {
      usage: 0, 
      quota: 5 * 1024 * 1024 * 1024 
    };
  }
};
