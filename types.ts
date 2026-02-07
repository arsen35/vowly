
export interface User {
  id: string;
  name: string;
  username?: string;
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
  likedBy?: string[];
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
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: number;
  otherUser?: User;
  unreadBy?: string[];
}

export interface AppNotification {
  id: string;
  userId: string; // Alıcı
  type: 'dm' | 'post' | 'follow';
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  relatedId?: string; // postId veya convId
  timestamp: number;
  read: boolean;
}

export enum ViewState {
  FEED = 'FEED',
  UPLOAD = 'UPLOAD',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  BLOG = 'BLOG',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  DM_CHAT = 'DM_CHAT',
  USER_PROFILE = 'USER_PROFILE'
}
