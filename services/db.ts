
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

// --- GÜÇLENDİRİLMİŞ UPLOAD FONKSİYONU (ArrayBuffer Modu - v1.3 Fix) ---
// Bu fonksiyon "invalid-argument" hatasını çözmek için veriyi ham binary formata çevirir.
const uploadImageToStorage = async (input: any, path: string): Promise<string> => {
  if (!input) throw new Error("Yüklenecek veri boş.");

  const { storageInstance } = checkDbConnection();
  const storageRef = ref(storageInstance, path);
  
  // Debug
  console.log("Upload v1.3 başlatılıyor. Veri Tipi:", typeof input);

  try {
      let dataToUpload: Uint8Array | null = null;
      let contentType = 'image/jpeg'; // Varsayılan

      // 1. Zaten HTTP Linki ise (Upload etme, geri döndür)
      if (typeof input === 'string' && input.startsWith('http') && !input.startsWith('blob:')) {
          return input;
      }

      // 2. Base64 String ise (Data URL)
      if (typeof input === 'string' && input.startsWith('data:')) {
          const snapshot = await uploadString(storageRef, input, 'data_url');
          return await getDownloadURL(snapshot.ref);
      }

      // 3. Blob URL veya File/Blob Nesnesi ise -> Buffer'a çevir
      // Burası "invalid-argument" hatasının kesin çözümüdür.
      // Tarayıcının File nesnesini olduğu gibi yollamak yerine, içindeki veriyi okuyup
      // "Sayı Dizisi" (Uint8Array) olarak yolluyoruz.
      if ((typeof input === 'string' && input.startsWith('blob:')) || input instanceof File || input instanceof Blob) {
           let blob: Blob;
           
           if (typeof input === 'string') {
               // Blob URL ise fetch et
               console.log("Blob URL fetch ediliyor...");
               const response = await fetch(input);
               blob = await response.blob();
           } else {
               // Zaten File/Blob ise direkt kullan
               console.log("File/Blob nesnesi işleniyor...");
               blob = input;
           }

           contentType = blob.type || 'image/jpeg';
           // Blob'u ArrayBuffer'a, onu da Uint8Array'e çevir
           const arrayBuffer = await blob.arrayBuffer();
           dataToUpload = new Uint8Array(arrayBuffer);
      }

      
      // Eğer veri hazırsa yükle
      if (dataToUpload) {
          console.log(`Veri yükleniyor... Boyut: ${dataToUpload.length} bytes, Tip: ${contentType}`);
          // Metadata ile birlikte yükle
          const snapshot = await uploadBytes(storageRef, dataToUpload, { contentType: contentType });
          return await getDownloadURL(snapshot.ref);
      }
      
      throw new Error("Dosya formatı işlenemedi (Veri boş).");
      
  } catch (error: any) {
      console.error("Upload Hatası (v1.3):", error);
      
      let msg = error.message;
      if (error.code === 'storage/invalid-argument') {
          msg = "Dosya formatı Firebase tarafından kabul edilmedi (invalid-argument).";
      } else if (error.code === 'storage/unauthorized') {
          msg = "Yükleme izniniz yok (Yetki hatası).";
      }

      throw new Error(`Yükleme başarısız: ${msg}`);
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
        
        // Önemli: Eğer item.file (gerçek dosya) varsa onu kullan.
        // Yoksa item.url'i kullan (URL ise zaten upload fonksiyonu onu blob'dan kurtaracak).
        const source = item.file ? item.file : item.url;
        
        const downloadURL = await uploadImageToStorage(source, path);
        
        // Kaydettikten sonra ağır verileri temizle, sadece URL kalsın
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
    const imageUrl = await uploadImageToStorage(post.coverImage, path);
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
         const imageUrl = await uploadImageToStorage(message.image, path);
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
