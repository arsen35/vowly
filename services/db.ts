import { Post, BlogPost } from '../types';
import { db, storage } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  limit
} from "firebase/firestore";
import { 
  ref, 
  uploadString, 
  getDownloadURL, 
} from "firebase/storage";

const POSTS_COLLECTION = 'posts';
const BLOG_COLLECTION = 'blog_posts';

// Yardımcı Fonksiyon: Veritabanı hazır mı kontrolü
const checkDbConnection = () => {
  if (!db || !storage) {
    console.warn("Firebase bağlantısı yok! İşlem gerçekleştirilemedi.");
    throw new Error("Veritabanı bağlantısı yapılamadı. Lütfen .env dosyasını kontrol edin.");
  }
  return { dbInstance: db, storageInstance: storage };
};

const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
  if (base64Data.startsWith('http')) return base64Data;
  
  const { storageInstance } = checkDbConnection();
  const storageRef = ref(storageInstance, path);
  await uploadString(storageRef, base64Data, 'data_url');
  return await getDownloadURL(storageRef);
};

export const dbService = {
  // --- FEED (POSTS) ---

  getAllPosts: async (): Promise<Post[]> => {
    try {
      if (!db) return []; // Beyaz ekranı önlemek için sessizce boş dön
      
      const postsRef = collection(db, POSTS_COLLECTION);
      const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        posts.push(doc.data() as Post);
      });
      
      return posts;
    } catch (error) {
      console.error("Firebase veri çekme hatası:", error);
      return [];
    }
  },

  savePost: async (post: Post): Promise<void> => {
    try {
      const { dbInstance } = checkDbConnection();

      // Medyaları Storage'a yükle
      const updatedMedia = await Promise.all(post.media.map(async (item, index) => {
        const path = `posts/${post.id}/media_${index}_${Date.now()}`;
        const downloadURL = await uploadImageToStorage(item.url, path);
        return { ...item, url: downloadURL };
      }));

      const postToSave = { ...post, media: updatedMedia };
      await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), postToSave);

    } catch (error) {
      console.error("Post kayıt hatası:", error);
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
      
      const path = `blog/${post.id}/cover_${Date.now()}`;
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