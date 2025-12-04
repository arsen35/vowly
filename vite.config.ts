import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Mevcut çalışma dizinindeki env değişkenlerini yükle
  // Vercel'deki 'VITE_API_KEY'i burada yakalayacağız
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Vercel'de tanımlı 'VITE_API_KEY' (veya 'API_KEY') değerini
      // kodun içinde kullanılan 'process.env.API_KEY' değerine eşliyoruz.
      // Bu sayede kod değişikliği yapmadan Vercel ile uyumlu hale geliyoruz.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  }
})