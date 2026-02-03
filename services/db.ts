
import { Post, BlogPost, ChatMessage, MediaItem, User } from '../types';
import { db, storage } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query, 
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  increment,
  getDoc,
  arrayUnion,
  where,
  writeBatch
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL
} from "firebase/storage";

const POSTS_COLLECTION = 'posts';
const BLOG_COLLECTION = 'blog_posts';
const CHAT_COLLECTION = 'chat_messages';
const USERS_COLLECTION = 'users';

const checkDbConnection = () => {
  if (!db || !storage) {
    console.warn("Firebase bağlantısı yok!");
    throw new Error("Veritabanı bağlantısı yapılamadı.");
  }
  return { dbInstance: db, storageInstance: storage };
};

// Firestore'un sevmediği undefined değerleri temizleyen yardımcı fonksiyon
const sanitizeData = (data: any) => {
    const cleanData = JSON.parse(JSON.stringify(data));
    // JSON parse/stringify döngüsü undefined değerleri otomatik siler
    return cleanData;
};

const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.naturalWidth || img.width;
                    let height = img.naturalHeight || img.height;
                    const maxSize = 1920;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round((height / width) * maxSize);
                            width = maxSize;
                        } else {
                            width = Math.round((width / height) * maxSize);
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { alpha: false });
                    if (!ctx) { reject(new Error('Canvas context hatası')); return; }
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Blob oluşturulamadı'));
                    }, 'image/jpeg', 0.85);
                } catch (error) { reject(error); }
            };
            img.onerror = (err) => reject(err);
            if (typeof e.target?.result === 'string') img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

const uploadMediaItem = async (item: MediaItem | string, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const storageRef = ref(storageInstance, path);

    try {
        if (typeof item === 'string') {
            if (item.startsWith('http')) return item;
            if (item.startsWith('blob:') || item.startsWith('data:')) {
                const response = await fetch(item);
                const blob = await response.blob();
                const snapshot = await uploadBytes(storageRef, blob);
                return await getDownloadURL(snapshot.ref);
            }
            throw new Error("Geçersiz format");
        } 
        
        const mediaItem = item as MediaItem;
        if (mediaItem.file) {
            const optimizedBlob = await optimizeImage(mediaItem.file);
            const snapshot = await uploadBytes(storageRef, optimizedBlob);
            return await getDownloadURL(snapshot.ref);
        }
        
        if (mediaItem.url) {
             const response = await fetch(mediaItem.url);
             const blob = await response.blob();
             const snapshot = await uploadBytes(storageRef, blob);
             return await getDownloadURL(snapshot.ref);
        }
        
        throw new Error("Dosya bulunamadı");
    } catch (error: any) {
        console.error("Upload Hatası:", error);
        throw error;
    }
};

export const dbService = {
  // --- USERS ---
  saveUser: async (user: User): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await setDoc(doc(dbInstance, USERS_COLLECTION, user.id), sanitizeData(user), { merge: true });
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await updateDoc(doc(dbInstance, USERS_COLLECTION, userId), sanitizeData(data));
  },

  getUser: async (userId: string): Promise<User | null> => {
    const { dbInstance } = checkDbConnection();
    const docSnap = await getDoc(doc(dbInstance, USERS_COLLECTION, userId));
    return docSnap.exists() ? docSnap.data() as User : null;
  },

  deleteUserAccount: async (userId: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    const postsRef = collection(dbInstance, POSTS_COLLECTION);
    const q = query(postsRef, where("user.id", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(dbInstance);
    querySnapshot.forEach((postDoc) => {
        batch.delete(postDoc.ref);
    });
    
    batch.delete(doc(dbInstance, USERS_COLLECTION, userId));
    await batch.commit();
  },

  // --- FEED (POSTS) ---
  subscribeToPosts: (callback: (posts: Post[]) => void) => {
    if (!db) return () => {};
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const posts: Post[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data() as Post;
            posts.push({ ...data, id: doc.id });
        });
        callback(posts);
    });
  },

  getAllPosts: async (): Promise<Post[]> => {
    if (!db) return []; 
    const querySnapshot = await getDocs(query(collection(db, POSTS_COLLECTION), orderBy("timestamp", "desc"), limit(50)));
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => posts.push({ ...(doc.data() as Post), id: doc.id }));
    return posts;
  },

  updateLikeCount: async (postId: string, incrementBy: number): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await updateDoc(doc(dbInstance, POSTS_COLLECTION, postId), { likes: increment(incrementBy) });
  },

  addComment: async (postId: string, comment: any): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await updateDoc(doc(dbInstance, POSTS_COLLECTION, postId), { comments: arrayUnion(sanitizeData(comment)) });
  },

  savePost: async (post: Post): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    const updatedMedia = [];
    for (let index = 0; index < post.media.length; index++) {
      const downloadURL = await uploadMediaItem(post.media[index], `posts/${post.id}/media_${index}_${Date.now()}`);
      updatedMedia.push({ ...post.media[index], url: downloadURL });
    }
    const { isLikedByCurrentUser, ...postToSave } = { ...post, media: updatedMedia };
    await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), sanitizeData(postToSave));
  },

  deletePost: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, POSTS_COLLECTION, id));
  },

  // --- BLOG ---
  subscribeToBlogPosts: (callback: (posts: BlogPost[]) => void) => {
    if (!db) return () => {};
    const blogRef = collection(db, BLOG_COLLECTION);
    const q = query(blogRef, orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const posts: BlogPost[] = [];
        snapshot.forEach((doc) => {
            posts.push({ ...(doc.data() as BlogPost), id: doc.id });
        });
        callback(posts);
    });
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    let imageUrl = post.coverImage;
    if (post.coverImage.startsWith('data:') || post.coverImage.startsWith('blob:')) {
        const path = `blog/${post.id}/cover_${Date.now()}`;
        imageUrl = await uploadMediaItem(post.coverImage, path);
    }
    const blogToSave = { ...post, coverImage: imageUrl };
    await setDoc(doc(dbInstance, BLOG_COLLECTION, post.id), sanitizeData(blogToSave));
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
         finalMessage.image = await uploadMediaItem(message.image, `chat_images/${Date.now()}_img`);
    }
    await addDoc(collection(dbInstance, CHAT_COLLECTION), sanitizeData(finalMessage));
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

  getStorageEstimate: async () => {
      try {
          if (navigator.storage && navigator.storage.estimate) {
              const estimate = await navigator.storage.estimate();
              return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
          }
      } catch (e) {}
      return { usage: 0, quota: 0 };
  }
};
