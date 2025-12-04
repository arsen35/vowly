import { Post } from '../types';

const DB_NAME = 'VowlyDB';
const STORE_NAME = 'posts';
const DB_VERSION = 1;

// Veritabanını açan yardımcı fonksiyon
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const dbService = {
  // Tüm gönderileri getir
  getAllPosts: async (): Promise<Post[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Tarihe göre tersten sırala (en yeni en üstte)
        const posts = request.result as Post[];
        posts.sort((a, b) => b.timestamp - a.timestamp);
        resolve(posts);
      };
    });
  },

  // Yeni gönderi ekle veya güncelle
  savePost: async (post: Post): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(post);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  // Gönderi sil
  deletePost: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  // Tüm verileri temizle (Factory Reset)
  clearAll: async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  // Depolama alanı bilgisini al (Tahmini)
  getStorageEstimate: async (): Promise<{ usage: number; quota: number }> => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }
};