
export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface MediaItem {
  url: string; // Ekranda görünen link (blob:...)
  type: 'image' | 'video';
  file?: File; // Seçilen orijinal dosya
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

export enum ViewState {
  FEED = 'FEED',
  UPLOAD = 'UPLOAD',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  BLOG = 'BLOG',
  CHAT = 'CHAT'
}
