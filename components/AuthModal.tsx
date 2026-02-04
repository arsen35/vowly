
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
  const [showPassword, setShowPassword] = useState(false);
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
        name: user.displayName || 'Yeni Üye',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=A66D60&color=fff&bold=true`
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
        {/* İkon Bölümü */}
        <div className="flex justify-center mb-8">
            <div className="w-16 h-16 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-gray-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-transparent border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-xl py-3 px-4 text-[11px] font-bold uppercase tracking-widest text-black dark:text-white transition-all mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          Google ile Devam Et
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-zinc-900"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em]"><span className="bg-white dark:bg-theme-black px-4 text-gray-400 font-bold">Veya</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
                <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-gray-100 dark:border-zinc-900 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-colors"
                    placeholder="Adınız Soyadınız"
                />
            )}
            <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-gray-100 dark:border-zinc-900 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-colors"
                placeholder="E-Posta Adresi"
            />
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    required value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-gray-100 dark:border-zinc-900 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-colors pr-12"
                    placeholder="Şifre"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wedding-500 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.323 7.317 7.244 4.5 12 4.5c4.756 0 8.773 2.817 9.965 7.178.07.242.07.483 0 .726C20.677 16.683 16.756 19.5 12 19.5c-4.756 0-8.773-2.817-9.965-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
            </div>
            {error && <p className="text-red-400 text-[10px] text-center font-bold tracking-tight py-1">{error}</p>}
            
            <Button type="submit" className="w-full py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] mt-2 shadow-none border border-wedding-500" isLoading={isLoading}>
                {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
            </Button>
        </form>

        <button 
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full mt-8 text-[9px] text-gray-400 hover:text-wedding-500 font-bold uppercase tracking-[0.2em] transition-all"
        >
            {mode === 'login' ? 'Hesabın yok mu? Kaydol' : 'Zaten üye misin? Giriş Yap'}
        </button>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-theme-black border border-gray-100 dark:border-zinc-900 rounded-[32px] w-full max-w-sm shadow-2xl p-8 pt-10 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-wedding-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <AuthModalContent onLoginSuccess={() => { onLoginSuccess(); onClose(); }} />
      </div>
    </div>
  );
};
