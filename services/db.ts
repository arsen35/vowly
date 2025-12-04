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
  deleteObject 
} from "firebase/storage";

const POSTS_COLLECTION = 'posts';
const BLOG_COLLECTION = 'blog_posts';

// Yardımcı Fonksiyon: Base64 resmi Firebase Storage'a yükler
const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
  // Eğer zaten bir URL ise yükleme yapma
  if (base64Data.startsWith('http')) return base64Data;

  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, 'data_url');
  return await getDownloadURL(storageRef);
};

export const dbService = {
  // --- FEED (POSTS) ---

  getAllPosts: async (): Promise<Post[]> => {
    try {
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
      // Medyaları Storage'a yükle
      const updatedMedia = await Promise.all(post.media.map(async (item, index) => {
        const path = `posts/${post.id}/media_${index}_${Date.now()}`;
        const downloadURL = await uploadImageToStorage(item.url, path);
        
        return {
          ...item,
          url: downloadURL
        };
      }));

      const postToSave = { ...post, media: updatedMedia };
      await setDoc(doc(db, POSTS_COLLECTION, post.id), postToSave);

    } catch (error) {
      console.error("Post kayıt hatası:", error);
      throw error;
    }
  },

  deletePost: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, POSTS_COLLECTION, id));
      // Not: Storage'dan silme işlemi daha gelişmiş bir yapı gerektirir (dosya yollarını tutmak vb.)
      // Şimdilik sadece veritabanından siliyoruz.
    } catch (error) {
      console.error("Silme hatası:", error);
      throw error;
    }
  },

  // --- BLOG ---

  getAllBlogPosts: async (): Promise<BlogPost[]> => {
    try {
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
      const path = `blog/${post.id}/cover_${Date.now()}`;
      const imageUrl = await uploadImageToStorage(post.coverImage, path);

      const blogToSave = { ...post, coverImage: imageUrl };
      await setDoc(doc(db, BLOG_COLLECTION, post.id), blogToSave);
    } catch (error) {
      console.error("Blog kayıt hatası:", error);
      throw error;
    }
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, BLOG_COLLECTION, id));
  },

  // --- GENEL ---

  clearAll: async (): Promise<void> => {
    try {
       // Bu sadece demo amaçlıdır, storage'ı temizlemez
       const posts = await dbService.getAllPosts();
       const deletePromises = posts.map(post => deleteDoc(doc(db, POSTS_COLLECTION, post.id)));
       await Promise.all(deletePromises);
    } catch (error) {
       console.error("Toplu silme hatası:", error);
       throw error;
    }
  },

  getStorageEstimate: async (): Promise<{ usage: number; quota: number }> => {
    // Firebase Cloud Storage kotaları
    return {
      usage: 0, 
      quota: 5 * 1024 * 1024 * 1024 // 5 GB (Firebase Spark/Blaze yaklaşık)
    };
  }
};