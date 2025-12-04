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
  url: string;
  type: 'image' | 'video';
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
}

export enum ViewState {
  FEED = 'FEED',
  UPLOAD = 'UPLOAD',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}