import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase yapılandırması
// Bu bilgileri Firebase Console -> Project Settings -> General kısmından alıp
// .env dosyanıza eklemeniz gerekmektedir.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.API_KEY, 
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Yapılandırma kontrolü
  if (!firebaseConfig.projectId) {
    throw new Error("Firebase Project ID bulunamadı! Lütfen .env dosyasını kontrol edin.");
  }
  
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key bulunamadı! Lütfen .env dosyasını kontrol edin.");
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log("✅ Firebase bağlantısı başarılı:", firebaseConfig.projectId);

} catch (error) {
  console.error("🚨 FIREBASE BAĞLANTI HATASI:", error);
  console.error("Lütfen .env dosyanızın dolu olduğundan emin olun.");
  
  // Uygulamanın tamamen çökmemesi için dummy objeler oluşturabilir veya
  // hatayı yukarı fırlatabiliriz. Şimdilik hatayı fırlatıyoruz ki kullanıcı sorunu görsün.
  // Ancak production'da fallback mekanizması kurulabilir.
  throw error;
}

export { db, storage };