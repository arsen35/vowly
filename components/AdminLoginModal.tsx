
import React, { useState } from 'react';
import { Button } from './Button';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from "firebase/auth";

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
    
    if (!ADMIN_EMAILS.includes(cleanEmail)) {
        setError('Yetkisiz e-posta adresi.');
        return;
    }

    if (cleanPassword !== ADMIN_PASS) {
        setError('Hatalı güvenlik şifresi.');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        await signInWithEmailAndPassword(auth!, cleanEmail, cleanPassword);
        onLoginSuccess();
        onClose();
    } catch (err: any) {
        setError('Oturum açılamadı. Lütfen kontrol edin.');
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
                    className="w-full bg-transparent border-gray-100 dark:border-zinc-900 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-all"
                    placeholder="Admin E-Posta"
                />
            </div>
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-transparent border-gray-100 dark:border-zinc-900 border rounded-xl px-4 py-3.5 text-xs dark:text-white outline-none focus:border-wedding-500 transition-all"
                    placeholder="Güvenlik Şifresi"
                />
            </div>

            {error && <p className="text-red-400 text-[10px] font-bold text-center py-2 animate-fadeIn">{error}</p>}

            <Button type="submit" className="w-full py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] border border-wedding-500 shadow-none mt-4" isLoading={isLoading}>Giriş Yap</Button>
        </form>
      </div>
    </div>
  );
};
