import { Post } from '../types';
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

const COLLECTION_NAME = 'posts';

export const dbService = {
  // Tüm gönderileri getir (Firestore'dan)
  getAllPosts: async (): Promise<Post[]> => {
    try {
      const postsRef = collection(db, COLLECTION_NAME);
      // Tarihe göre sırala
      const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        posts.push(doc.data() as Post);
      });
      
      return posts;
    } catch (error) {
      console.error("Firebase'den veri çekilemedi:", error);
      // Hata durumunda boş dizi dön, uygulama çökmesin
      return [];
    }
  },

  // Yeni gönderi ekle (Önce Storage'a resim yükle, sonra Firestore'a veri yaz)
  savePost: async (post: Post): Promise<void> => {
    try {
      const updatedMedia = await Promise.all(post.media.map(async (item, index) => {
        // Eğer URL zaten bir http linki ise (önceden yüklenmişse) dokunma
        if (item.url.startsWith('http')) return item;

        // Base64 verisini Firebase Storage'a yükle
        // Dosya yolu: posts/{postId}/image_{index}
        const storageRef = ref(storage, `posts/${post.id}/media_${index}_${Date.now()}`);
        
        // uploadString Base64 data_url formatını destekler
        await uploadString(storageRef, item.url, 'data_url');
        
        // Yüklenen dosyanın indirme bağlantısını (public URL) al
        const downloadURL = await getDownloadURL(storageRef);
        
        return {
          ...item,
          url: downloadURL // Artık base64 değil, https://firebasestorage... linki
        };
      }));

      // Post objesini güncelle (Resim URL'leri değişti)
      const postToSave = {
        ...post,
        media: updatedMedia
      };

      // Firestore'a kaydet
      await setDoc(doc(db, COLLECTION_NAME, post.id), postToSave);

    } catch (error) {
      console.error("Kayıt hatası:", error);
      throw error;
    }
  },

  // Gönderi sil
  deletePost: async (id: string): Promise<void> => {
    try {
      // 1. Önce Firestore'dan veriyi sil
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      
      // 2. (Opsiyonel) Storage'dan resimleri silmek gerekir ama 
      // dosya isimlerini bilmemiz gerektiği için şimdilik sadece veritabanından siliyoruz.
      // İdeal senaryoda önce post verisini çekip, içindeki media URL'lerinden referans alıp silmeliyiz.
      
    } catch (error) {
      console.error("Silme hatası:", error);
      throw error;
    }
  },

  // Tüm verileri temizle (Sadece demo amaçlı, Admin panelinde çalışır)
  clearAll: async (): Promise<void> => {
    try {
       const posts = await dbService.getAllPosts();
       const deletePromises = posts.map(post => deleteDoc(doc(db, COLLECTION_NAME, post.id)));
       await Promise.all(deletePromises);
    } catch (error) {
       console.error("Toplu silme hatası:", error);
       throw error;
    }
  },

  // Depolama alanı bilgisi (Firebase için kotalar sabittir, bu fonksiyonu dummy yapıyoruz)
  getStorageEstimate: async (): Promise<{ usage: number; quota: number }> => {
    // Firebase Spark Plan (Ücretsiz) limitleri (örnek)
    return {
      usage: 0, // API ile anlık kullanım çekmek zordur, 0 dönüyoruz
      quota: 1024 * 1024 * 1024 // 1 GB (Örnek)
    };
  }
};