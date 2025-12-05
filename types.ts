
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
  url: string; // Önizleme için (blob: veya base64)
  type: 'image' | 'video';
  file?: File; // Yükleme için orijinal dosya
}

export interface Post {
  id: string;
  user: User;
  media: MediaItem[]; // Carousel için dizi yapısı
  caption: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  timestamp: number;
  isLikedByCurrentUser?: boolean;
  productUrl?: string; // SATIN ALMA LİNKİ
}

export interface BlogPost {
  id: string;
  title: string;
  content: string; // Paragraflar için düz metin
  coverImage: string;
  author: string;
  date: number;
  isFeatured?: boolean; // Vitrin/Manşet özelliği
  badge?: string; // "Ayın Gelinliği", "İmza Ürün" gibi etiketler
}

export interface ChatMessage {
  id: string;
  text: string;
  image?: string; // Opsiyonel resim alanı
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
