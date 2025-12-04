import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.API_KEY, 
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

try {
  // Basit bir kontrol: API Key veya Project ID yoksa başlatma
  if (firebaseConfig.projectId && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("✅ Firebase bağlantısı başlatıldı.");
  } else {
    console.warn("⚠️ Firebase yapılandırması eksik. Uygulama 'Demo Modu'nda çalışacak veya veri çekemeyecek.");
  }

} catch (error) {
  console.error("🚨 FIREBASE BAĞLANTI HATASI:", error);
  // Hata fırlatmıyoruz, böylece ekran beyaz kalmıyor.
}

export { db, storage };