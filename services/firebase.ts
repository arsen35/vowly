
import * as firebaseApp from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwgsaLVZ0Lh3w6g1u22gvpWUMcLDvES5U",
  authDomain: "vowly-d2753.firebaseapp.com",
  projectId: "vowly-d2753",
  storageBucket: "vowly-d2753.firebasestorage.app",
  messagingSenderId: "471322112476",
  appId: "1:471322112476:web:84adbc928a65a0a9e09f19",
  measurementId: "G-WR2GP3MYJ4"
};

let app: any;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

try {
  // @ts-ignore
  const hasConfig = firebaseConfig?.apiKey;

  if (hasConfig) {
    const initApp = (firebaseApp as any).initializeApp || (firebaseApp as any).default?.initializeApp;
    
    if (initApp) {
        app = initApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        console.log("✅ Firebase (Google Auth) bağlantısı hazır.");
    }
  }
} catch (error) {
  console.error("🚨 Firebase başlatılamadı:", error);
}

export { db, storage, auth, googleProvider };
