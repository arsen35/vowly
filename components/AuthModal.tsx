
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

export const AuthModalContent: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await dbService.saveUser({
        id: user.uid,
        name: user.displayName || 'İsimsiz Gelin',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'G')}&background=A66D60&color=fff&bold=true`
      });
      onLoginSuccess();
    } catch (err: any) {
      setError('Google ile giriş başarısız oldu.');
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
        await updateProfile(userCredential.user, { displayName: name });
        await dbService.saveUser({
          id: userCredential.user.uid,
          name: name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A66D60&color=fff&bold=true`
        });
      } else {
        await signInWithEmailAndPassword(auth!, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl py-3.5 px-4 text-sm font-bold text-black dark:text-white transition-all shadow-sm mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Google ile Giriş Yap
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-zinc-800"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest"><span className="bg-white dark:bg-theme-dark px-3 text-gray-400 font-bold">Veya</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
                <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1c1c1e] border-gray-100 dark:border-zinc-800 border rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-1 focus:ring-wedding-500"
                    placeholder="Ad Soyad"
                />
            )}
            <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1c1c1e] border-gray-100 dark:border-zinc-800 border rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-1 focus:ring-wedding-500"
                placeholder="E-Posta"
            />
            <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1c1c1e] border-gray-100 dark:border-zinc-800 border rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-1 focus:ring-wedding-500"
                placeholder="Şifre"
            />
            {error && <p className="text-[#ff4d4d] text-[11px] text-center font-bold">{error}</p>}
            
            <Button type="submit" className="w-full py-4 rounded-xl" isLoading={isLoading}>
                {mode === 'login' ? 'Giriş Yap' : 'Kaydol'}
            </Button>
        </form>

        <button 
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full mt-6 text-[10px] text-gray-500 hover:text-wedding-500 font-bold uppercase tracking-widest transition-all"
        >
            {mode === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap'}
        </button>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-theme-dark border dark:border-zinc-800 rounded-[32px] w-full max-w-sm shadow-2xl p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold dark:text-white">Hoş Geldiniz</h2>
        </div>
        <AuthModalContent onLoginSuccess={() => { onLoginSuccess(); onClose(); }} />
      </div>
    </div>
  );
};
