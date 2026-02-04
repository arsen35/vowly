
export interface User {
  id: string;
  name: string;
  username?: string; // Benzersiz @kullaniciadi
  avatar: string;
  bio?: string;
  weddingDate?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface MediaItem {
  url: string; 
  type: 'image' | 'video';
  file?: File; 
  mimeType?: string;
}

export interface Post {
  id: string;
  user: User;
  media: MediaItem[]; 
  caption: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  timestamp: number;
  isLikedByCurrentUser?: boolean;
  productUrl?: string; 
  location?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string; 
  coverImage: string;
  author: string;
  date: number;
  isFeatured?: boolean; 
  badge?: string; 
}

export interface ChatMessage {
  id: string;
  text: string;
  image?: string; 
  userId: string;
  userName: string;
  avatar: string;
  timestamp: number;
  isAdmin?: boolean;
}

export interface Conversation {
  id: string; // user1_user2 formatında
  participants: string[]; // [uid1, uid2]
  lastMessage?: string;
  lastMessageTimestamp?: number;
  otherUser?: User; // Frontend için kolaylık
  unreadBy?: string[]; // Okunmamış olan kullanıcı ID'leri
}

export enum ViewState {
  FEED = 'FEED',
  UPLOAD = 'UPLOAD',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  BLOG = 'BLOG',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  DM_CHAT = 'DM_CHAT'
}
