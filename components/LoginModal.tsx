import React, { useState } from 'react';
import { Button } from './Button';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (password: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    // Basit kontrol, gerçek kontrol App.tsx'de yapılacak
    onLogin(password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 transform transition-all scale-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-wedding-100 text-wedding-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Yönetici Girişi</h2>
          <p className="text-sm text-gray-500 mt-1">Lütfen devam etmek için şifreyi girin.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-wedding-500 focus:ring-1 focus:ring-wedding-500 transition-all text-center tracking-widest"
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose} 
                className="flex-1"
            >
                İptal
            </Button>
            <Button 
                type="submit" 
                className="flex-1"
            >
                Giriş Yap
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};