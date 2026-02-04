
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
        setError('Bu e-posta adresi yönetici yetkisine sahip değil.');
        return;
    }

    if (cleanPassword !== ADMIN_PASS) {
        setError('Hatalı yönetici şifresi.');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        await signInWithEmailAndPassword(auth!, cleanEmail, cleanPassword);
        onLoginSuccess();
        onClose();
    } catch (err: any) {
        console.error("Admin Login Error:", err.code);
        setError('Oturum açılamadı. Lütfen e-postanızı ve şifrenizi kontrol edin.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121212] border border-red-900/30 rounded-2xl w-full max-w-sm shadow-2xl p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-900/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-white tracking-tight uppercase">Yönetici Girişi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Yönetici E-Posta</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#1c1c1e] border-zinc-800 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    placeholder="mail@sw-agency.com"
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Güvenlik Şifresi</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-[#1c1c1e] border-zinc-800 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-red-500 transition-all"
                        placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {error && <p className="text-[#ff4d4d] text-[10px] font-bold text-center bg-red-900/10 py-2 rounded-lg animate-fadeIn">{error}</p>}

            <Button type="submit" className="w-full py-4 rounded-xl shadow-none bg-red-600 hover:bg-red-700" isLoading={isLoading}>Giriş Yap</Button>
        </form>
      </div>
    </div>
  );
};
