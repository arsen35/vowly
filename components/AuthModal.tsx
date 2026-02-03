
import React, { useState } from 'react';
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

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) return;
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
      setError('Google ile giriş başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) return;
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await dbService.saveUser({
          id: user.uid,
          name: name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A66D60&color=fff&bold=true`
        });
      } else {
        await signInWithEmailAndPassword(auth!, email, password);
      }
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'Kullanıcı bulunamadı.' : 'Hatalı e-posta veya şifre.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-theme-dark rounded-2xl w-full max-w-sm shadow-2xl p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-wedding-50 dark:bg-wedding-900/30 text-wedding-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-wedding-100">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <h2 className="text-2xl font-serif font-bold dark:text-white">{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm mb-6"
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
                    className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700"
                    placeholder="Adın Soyadın"
                />
            )}
            <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700"
                placeholder="E-Posta Adresi"
            />
            <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700"
                placeholder="Şifren"
            />
            {error && <p className="text-red-500 text-[10px] text-center font-bold">{error}</p>}
            <Button type="submit" className="w-full py-4 rounded-xl shadow-none" isLoading={isLoading}>{mode === 'login' ? 'Giriş Yap' : 'Kaydol'}</Button>
        </form>

        <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full mt-6 text-[11px] text-gray-400 hover:text-wedding-500 font-bold uppercase tracking-widest transition-all"
        >
            {mode === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap'}
        </button>
      </div>
    </div>
  );
};
