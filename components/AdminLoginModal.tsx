
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_EMAILS = ['jeanbox35@gmail.com', 'swoxagency@gmail.com', 'nossdigital@gmail.com'];
  const ADMIN_PASS = 'ArsenLupen2026!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
        setError('Bu e-posta adresi yönetici yetkisine sahip değil.');
        return;
    }

    if (password !== ADMIN_PASS) {
        setError('Hatalı yönetici şifresi.');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        await signInWithEmailAndPassword(auth!, email, password);
        onLoginSuccess();
        onClose();
    } catch (err: any) {
        setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-theme-dark rounded-2xl w-full max-w-sm shadow-2xl p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold dark:text-white tracking-tight uppercase">Yönetici Yetkilendirmesi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Yönetici E-Posta</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700"
                    placeholder="mail@sw-agency.com"
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Güvenlik Şifresi</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm dark:text-white outline-none ring-1 ring-gray-100 dark:ring-gray-700"
                    placeholder="••••••••"
                />
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">{error}</p>}

            <Button type="submit" className="w-full py-4 rounded-xl shadow-none" isLoading={isLoading}>Yönetici Olarak Gir</Button>
        </form>
      </div>
    </div>
  );
};
