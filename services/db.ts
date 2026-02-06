
import { Post, BlogPost, ChatMessage, MediaItem, User, Conversation } from '../types';
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
  arrayRemove,
  where,
  writeBatch,
  documentId,
  serverTimestamp
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
const FOLLOWS_COLLECTION = 'follows';
const CONVERSATIONS_COLLECTION = 'conversations';
const DIRECT_MESSAGES_COLLECTION = 'direct_messages';
const MAINTENANCE_COLLECTION = 'maintenance';

const checkDbConnection = () => {
  if (!db || !storage) throw new Error("Veritabanı bağlantısı yok.");
  return { dbInstance: db, storageInstance: storage };
};

const sanitizeData = (data: any) => JSON.parse(JSON.stringify(data));

export const dbService = {
  // --- MAINTENANCE & CLEANUP (24h Auto-Delete) ---
  performDailyCleanup: async () => {
    const { dbInstance } = checkDbConnection();
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    try {
      const maintRef = doc(dbInstance, MAINTENANCE_COLLECTION, 'last_cleanup');
      const maintSnap = await getDoc(maintRef);
      
      if (maintSnap.exists()) {
        const lastCleanup = maintSnap.data().timestamp;
        if (now - lastCleanup < (24 * 60 * 60 * 1000)) return;
      }

      const batch = writeBatch(dbInstance);

      const globalChatQ = query(collection(dbInstance, CHAT_COLLECTION), where("timestamp", "<", twentyFourHoursAgo));
      const globalChatSnap = await getDocs(globalChatQ);
      globalChatSnap.forEach(d => batch.delete(d.ref));

      const convsSnap = await getDocs(collection(dbInstance, CONVERSATIONS_COLLECTION));
      for (const convDoc of convsSnap.docs) {
        const dmQ = query(collection(dbInstance, CONVERSATIONS_COLLECTION, convDoc.id, DIRECT_MESSAGES_COLLECTION), where("timestamp", "<", twentyFourHoursAgo));
        const dmSnap = await getDocs(dmQ);
        dmSnap.forEach(d => batch.delete(d.ref));
        
        if (!dmSnap.empty) {
            batch.update(convDoc.ref, {
                lastMessage: "Sohbet geçmişi temizlendi.",
                unreadBy: []
            });
        }
      }

      batch.set(maintRef, { timestamp: now });
      await batch.commit();
    } catch (error) {
      console.error("Cleanup Error:", error);
    }
  },

  uploadMedia: async (file: File, path: string): Promise<string> => {
    const { storageInstance } = checkDbConnection();
    const fileRef = ref(storageInstance, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  subscribeToUser: (userId: string, callback: (user: User | null) => void) => {
    if (!db) return () => {};
    return onSnapshot(doc(db, USERS_COLLECTION, userId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...docSnap.data(), id: docSnap.id } as User);
      } else {
        callback(null);
      }
    });
  },

  checkUsernameUnique: async (username: string, excludeUserId?: string): Promise<boolean> => {
    const { dbInstance } = checkDbConnection();
    const q = query(collection(dbInstance, USERS_COLLECTION), where("username", "==", username.toLowerCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeUserId && snap.docs[0].id === excludeUserId) return true;
    return false;
  },

  searchUsers: async (searchTerm: string): Promise<User[]> => {
    const { dbInstance } = checkDbConnection();
    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2) return [];
    
    const q = query(
        collection(dbInstance, USERS_COLLECTION), 
        where("username", ">=", term),
        where("username", "<=", term + '\uf8ff'),
        limit(10)
    );
    const snap = await getDocs(q);
    const users: User[] = [];
    snap.forEach(d => users.push({ ...d.data(), id: d.id } as User));
    return users;
  },

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

  getUsersByIds: async (userIds: string[]): Promise<User[]> => {
    if (!userIds || userIds.length === 0) return [];
    const { dbInstance } = checkDbConnection();
    const uniqueIds = Array.from(new Set(userIds.filter(id => id)));
    const users: User[] = [];
    for (let i = 0; i < uniqueIds.length; i += 10) {
        const chunk = uniqueIds.slice(i, i + 10);
        const q = query(collection(dbInstance, USERS_COLLECTION), where(documentId(), "in", chunk));
        const snap = await getDocs(q);
        snap.forEach(d => users.push({ ...d.data(), id: d.id } as User));
    }
    return users;
  },

  getConversationId: (uid1: string, uid2: string) => [uid1, uid2].sort().join('_'),

  sendDirectMessage: async (sender: User, receiverId: string, text: string) => {
    const { dbInstance } = checkDbConnection();
    const convId = dbService.getConversationId(sender.id, receiverId);
    const batch = writeBatch(dbInstance);
    
    const msgRef = doc(collection(dbInstance, CONVERSATIONS_COLLECTION, convId, DIRECT_MESSAGES_COLLECTION));
    batch.set(msgRef, { 
      senderId: sender.id, 
      text, 
      timestamp: Date.now() 
    });

    const convRef = doc(dbInstance, CONVERSATIONS_COLLECTION, convId);
    batch.set(convRef, { 
      id: convId, 
      participants: [sender.id, receiverId], 
      lastMessage: text, 
      lastMessageTimestamp: Date.now(),
      unreadBy: arrayUnion(receiverId) 
    }, { merge: true });
    
    await batch.commit();
  },

  markConversationAsRead: async (convId: string, userId: string) => {
    const { dbInstance } = checkDbConnection();
    const convRef = doc(dbInstance, CONVERSATIONS_COLLECTION, convId);
    await updateDoc(convRef, {
      unreadBy: arrayRemove(userId)
    });
  },

  subscribeToConversations: (uid: string, callback: (convs: Conversation[]) => void) => {
    if (!db) return () => {};
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION), 
      where("participants", "array-contains", uid)
    );
    return onSnapshot(q, (snap) => {
        const convs: Conversation[] = [];
        snap.forEach(d => {
            convs.push({ ...d.data() } as Conversation);
        });
        callback(convs);
    });
  },

  subscribeToDirectMessages: (convId: string, callback: (msgs: any[]) => void) => {
    if (!db) return () => {};
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION, convId, DIRECT_MESSAGES_COLLECTION), 
      orderBy("timestamp", "asc"), 
      limit(100)
    );
    return onSnapshot(q, (snap) => {
        const msgs: any[] = [];
        snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
        callback(msgs);
    });
  },

  followUser: async (followerId: string, targetUserId: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await setDoc(doc(dbInstance, FOLLOWS_COLLECTION, followerId), { following: arrayUnion(targetUserId) }, { merge: true });
    await setDoc(doc(dbInstance, FOLLOWS_COLLECTION, targetUserId), { followers: arrayUnion(followerId) }, { merge: true });
  },

  unfollowUser: async (followerId: string, targetUserId: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await updateDoc(doc(dbInstance, FOLLOWS_COLLECTION, followerId), { following: arrayRemove(targetUserId) });
    await updateDoc(doc(dbInstance, FOLLOWS_COLLECTION, targetUserId), { followers: arrayRemove(followerId) });
  },

  subscribeToFollowData: (userId: string, callback: (data: any) => void) => {
    if (!db) return () => {};
    return onSnapshot(doc(db, FOLLOWS_COLLECTION, userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({ following: data.following || [], followers: data.followers || [] });
      } else {
        callback({ following: [], followers: [] });
      }
    });
  },

  // --- POSTS ---
  subscribeToPosts: (callback: (posts: Post[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, POSTS_COLLECTION), orderBy("timestamp", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
        const posts: Post[] = [];
        snapshot.forEach((doc) => posts.push({ ...(doc.data() as Post), id: doc.id }));
        callback(posts);
    });
  },

  getPostsLikedByUser: async (userId: string): Promise<Post[]> => {
    const { dbInstance } = checkDbConnection();
    const q = query(
        collection(dbInstance, POSTS_COLLECTION),
        where("likedBy", "array-contains", userId),
        orderBy("timestamp", "desc"),
        limit(50)
    );
    const snap = await getDocs(q);
    const posts: Post[] = [];
    snap.forEach(d => posts.push({ ...d.data(), id: d.id } as Post));
    return posts;
  },

  toggleLike: async (postId: string, userId: string, isLiked: boolean): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await updateDoc(doc(dbInstance, POSTS_COLLECTION, postId), { 
        likes: increment(isLiked ? 1 : -1),
        likedBy: isLiked ? arrayUnion(userId) : arrayRemove(userId)
    });
  },

  addComment: async (postId: string, comment: any): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await updateDoc(doc(dbInstance, POSTS_COLLECTION, postId), { comments: arrayUnion(sanitizeData(comment)) });
  },

  savePost: async (post: Post): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    const { isLikedByCurrentUser, ...postToSave } = post;
    await setDoc(doc(dbInstance, POSTS_COLLECTION, post.id), sanitizeData({
        ...postToSave,
        likedBy: post.likedBy || []
    }));
  },

  deletePost: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, POSTS_COLLECTION, id));
  },

  // --- BLOG & CHAT ---
  subscribeToBlogPosts: (callback: (posts: BlogPost[]) => void) => {
    if (!db) return () => {};
    return onSnapshot(query(collection(db, BLOG_COLLECTION), orderBy("date", "desc")), (snapshot) => {
        const posts: BlogPost[] = [];
        snapshot.forEach((doc) => posts.push({ ...(doc.data() as BlogPost), id: doc.id }));
        callback(posts);
    });
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await setDoc(doc(dbInstance, BLOG_COLLECTION, post.id), sanitizeData(post));
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    const { dbInstance } = checkDbConnection();
    await deleteDoc(doc(dbInstance, BLOG_COLLECTION, id));
  },

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
    await addDoc(collection(dbInstance, CHAT_COLLECTION), sanitizeData(message));
  },

  getStorageEstimate: async () => ({ usage: 0, quota: 0 }),
  clearAll: async () => {}
};
