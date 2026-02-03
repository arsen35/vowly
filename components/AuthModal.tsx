
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { auth, googleProvider } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup
} from "firebase/auth";
import { dbService } from '../services/db';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [detectedDomain, setDetectedDomain] = useState<string>("");

  useEffect(() => {
    const domain = window.location.hostname;
    setDetectedDomain(domain);
  }, []);

  const copyText = (text: string) => {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
        navigator.clipboard.writeText(text);
    }
  };

  const getFriendlyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda. Lütfen giriş yapmayı deneyin.';
      case 'auth/invalid-email':
        return 'Lütfen geçerli bir e-posta adresi girin.';
      case 'auth/weak-password':
        return 'Şifreniz çok zayıf. En az 6 karakter olmalıdır.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-posta adresi veya şifre hatalı.';
      case 'auth/popup-closed-by-user':
        return 'Giriş penceresi kapatıldı.';
      case 'auth/too-many-requests':
        return 'Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin.';
      default:
        return 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
        setError('Firebase bağlantısı henüz hazır değil.');
        return;
    }
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await dbService.saveUser({
        id: user.uid,
        name: user.displayName || 'İsimsiz Gelin',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'G')}&background=A66D60&color=fff&bold=true`
      });

      onLoginSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized')) {
        setError('unauthorized-domain');
      } else {
        setError(getFriendlyErrorMessage(err.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) return;
    if (!auth) {
        setError('Sistem henüz hazır değil.');
        return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await dbService.saveUser({
          id: user.uid,
          name: name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A66D60&color=fff&bold=true`
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
          setError('unauthorized-domain');
      } else {
          setError(getFriendlyErrorMessage(err.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-theme-dark rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-wedding-50 dark:bg-wedding-900/30 text-wedding-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-wedding-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                {mode === 'login' ? 'Giriş Yap' : 'Aramıza Katıl'}
              </h2>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 active:scale-95 mb-6"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google ile Devam Et
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white dark:bg-theme-dark px-3 text-gray-400 font-bold">Veya e-posta ile</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-wedding-500 transition-all"
                  placeholder="Adın Soyadın"
                />
              )}
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-wedding-500 transition-all"
                placeholder="E-Posta Adresin"
              />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3.5 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-wedding-500 transition-all"
                placeholder="Şifren"
              />

              {error === 'unauthorized-domain' ? (
                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20 text-center shadow-inner">
                    <p className="text-red-600 dark:text-red-400 text-[12px] font-bold mb-3 uppercase tracking-widest">Aktivasyon Gerekli</p>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-[10px] leading-relaxed mb-4">
                        Aşağıdaki <b>iki</b> adresi Firebase Authorized Domains kısmına ekleyin:
                    </p>

                    <div className="space-y-2 mb-4">
                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <code className="text-[10px] font-bold text-gray-400">blog.annabellabridal.com</code>
                            <button type="button" onClick={() => copyText('blog.annabellabridal.com')} className="text-[9px] text-wedding-500 font-bold">Kopyala</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <code className="text-[10px] font-bold text-wedding-500">{detectedDomain}</code>
                            <button type="button" onClick={() => copyText(detectedDomain)} className="text-[9px] text-wedding-500 font-bold">Kopyala</button>
                        </div>
                    </div>
                </div>
              ) : error && (
                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                    <p className="text-red-600 dark:text-red-400 text-[11px] text-center font-bold leading-relaxed">
                        {error}
                    </p>
                    {error.includes('giriş yapmayı deneyin') && (
                        <button 
                            type="button"
                            onClick={() => { setMode('login'); setError(''); }}
                            className="w-full mt-2 text-[10px] text-wedding-600 font-bold uppercase underline"
                        >
                            Giriş Ekranına Git
                        </button>
                    )}
                </div>
              )}

              <Button type="submit" className="w-full py-4 rounded-xl shadow-lg shadow-wedding-500/20" isLoading={isLoading}>
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Button>
            </form>

            <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="w-full mt-6 text-[11px] text-gray-400 hover:text-wedding-500 font-bold uppercase tracking-[0.2em] transition-all"
            >
                {mode === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap'}
            </button>
        </div>
        
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};
