import * as firebaseApp from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// ---------------------------------------------------------------------------
// ADIM 1: Firebase ekranında sana verilen 'const firebaseConfig = { ... }'
// kod bloğunun tamamını aşağıya yapıştır.
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyAwgsaLVZ0Lh3w6g1u22gvpWUMcLDvES5U",
  authDomain: "vowly-d2753.firebaseapp.com",
  projectId: "vowly-d2753",
  storageBucket: "vowly-d2753.firebasestorage.app",
  messagingSenderId: "471322112476",
  appId: "1:471322112476:web:84adbc928a65a0a9e09f19",
  measurementId: "G-WR2GP3MYJ4"
};

// ---------------------------------------------------------------------------

// Use any for app to avoid type errors if FirebaseApp is missing from exports in the current environment
let app: any;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

try {
  // Config kontrolü: Eğer anahtarlar boşsa uyarı verir ama uygulamayı çökertmez
  // Not: apiKey'in dolu olması bağlantı denemesi için yeterlidir.
  // @ts-ignore
  const hasConfig = firebaseConfig?.apiKey;

  if (hasConfig) {
    // Handle potential import issues with firebase/app by checking for initializeApp on the namespace or default export
    const initApp = (firebaseApp as any).initializeApp || (firebaseApp as any).default?.initializeApp;
    
    if (initApp) {
        app = initApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);
        console.log("✅ Firebase bağlantısı kuruldu.");
    } else {
        console.error("Firebase initializeApp bulunamadı (Import sorunu).");
    }
  } else {
    console.warn("⚠️ Firebase ayarları bulunamadı. Uygulama Demo modunda çalışacak.");
    console.log("Lütfen 'Register app' butonuna bastıktan sonra verilen kodu services/firebase.ts dosyasına ekleyin.");
  }

} catch (error) {
  console.error("🚨 Firebase başlatılamadı:", error);
}

export { db, storage };