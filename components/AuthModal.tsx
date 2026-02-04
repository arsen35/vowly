
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
        name: user.displayName || 'İsimsiz Gelin',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'G')}&background=A66D60&color=fff&bold=true`
      });

      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError('Google ile giriş başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda.';
      case 'auth/invalid-email':
        return 'Geçersiz bir e-posta adresi.';
      case 'auth/weak-password':
        return 'Şifre çok zayıf (en az 6 karakter).';
      case 'auth/user-not-found':
        return 'Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.';
      case 'auth/wrong-password':
        return 'Hatalı şifre girdiniz.';
      case 'auth/invalid-credential':
        return 'E-posta veya şifre hatalı.';
      case 'auth/operation-not-allowed':
        return 'DİKKAT: Firebase Console üzerinden Email/Password girişini aktif etmelisiniz!';
      default:
        return 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword || (mode === 'register' && !name)) return;
    
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth!, trimmedEmail, trimmedPassword);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        await dbService.saveUser({
          id: user.uid,
          name: name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A66D60&color=fff&bold=true`
        });
      } else {
        await signInWithEmailAndPassword(auth!, trimmedEmail, trimmedPassword);
      }
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.error("Auth Error Code:", err.code);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-zinc-900 border border-wedding-500/20 text-wedding-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2">
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </h2>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 rounded-xl py-3.5 px-4 text-sm font-bold text-black transition-all shadow-sm mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Google ile Devam Et
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#121212] px-3 text-gray-500 font-bold">Veya e-posta ile</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
                <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1c1c1e] border-zinc-800 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-wedding-500 transition-all"
                    placeholder="Adın Soyadın"
                />
            )}
            <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1c1c1e] border-zinc-800 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-wedding-500 transition-all"
                placeholder="E-Posta Adresi"
            />
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1c1c1e] border-zinc-800 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-wedding-500 transition-all"
                    placeholder="Şifren"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                    {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                </button>
            </div>
            {error && <p className="text-[#ff4d4d] text-[11px] text-center font-bold animate-fadeIn leading-tight">{error}</p>}
            
            <Button 
                type="submit" 
                className="w-full py-4 rounded-xl shadow-none bg-wedding-500 hover:bg-wedding-600 transition-colors" 
                isLoading={isLoading}
            >
                {mode === 'login' ? 'Giriş Yap' : 'Kaydol'}
            </Button>
        </form>

        <button 
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="w-full mt-6 text-[11px] text-gray-500 hover:text-wedding-500 font-bold uppercase tracking-widest transition-all"
        >
            {mode === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap'}
        </button>
      </div>
    </div>
  );
};
