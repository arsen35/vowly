import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase yapılandırması
// Bu bilgileri Firebase Console -> Project Settings -> General kısmından alıp
// .env dosyanıza eklemeniz gerekmektedir.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.API_KEY, // Fallback for demo purpose
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Eğer API key yoksa uyarı ver (Geliştirme aşamasında anlaşılması için)
if (!firebaseConfig.projectId && !process.env.API_KEY) {
  console.warn("⚠️ Firebase yapılandırması eksik! Lütfen .env dosyanızı düzenleyin.");
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
