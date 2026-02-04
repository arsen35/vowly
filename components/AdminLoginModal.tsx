
import React, { useState } from 'react';
import { Button } from './Button';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_EMAILS = ['jeanbox35@gmail.com', 'swoxagency@gmail.com', 'nossdigital@gmail.com'];
  const ADMIN_PASS = 'ArsenLupen2026!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) return;
    
    // 1. Manuel yetki kontrolü
    if (!ADMIN_EMAILS.includes(cleanEmail)) {
        setError('Bu e-posta adresi yönetici listesinde bulunamadı.');
        return;
    }

    if (cleanPassword !== ADMIN_PASS) {
        setError('Hatalı güvenlik şifresi. Lütfen tekrar deneyin.');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        // 2. Firebase ile giriş dene
        await signInWithEmailAndPassword(auth!, cleanEmail, cleanPassword);
        onLoginSuccess();
        onClose();
    } catch (err: any) {
        // 3. Eğer kullanıcı yoksa (auth/user-not-found), otomatik olarak oluştur
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth!, cleanEmail, cleanPassword);
                onLoginSuccess();
                onClose();
            } catch (createErr: any) {
                console.error("Kayıt hatası:", createErr);
                setError('Oturum açma yetkilendirme hatası (E02).');
            }
        } else {
            console.error("Login hatası:", err.code);
            setError('Sistem şu an meşgul, lütfen az sonra tekrar deneyin.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-theme-black border border-gray-100 dark:border-zinc-900 rounded-[32px] w-full max-w-sm shadow-2xl p-10 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-wedding-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-10">
            <div className="w-16 h-16 bg-transparent border border-gray-100 dark:border-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold dark:text-white tracking-[0.2em] uppercase">Panel Erişimi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-gray-50/50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-all"
                    placeholder="Admin E-Posta"
                />
            </div>
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-gray-50/50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-all pr-12"
                    placeholder="Güvenlik Şifresi"
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

            {error && <p className="text-red-400 text-[10px] font-bold text-center py-2 animate-fadeIn">{error}</p>}

            <Button type="submit" className="w-full py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] border border-wedding-500 shadow-none mt-4" isLoading={isLoading}>Giriş Yap</Button>
        </form>
      </div>
    </div>
  );
};
