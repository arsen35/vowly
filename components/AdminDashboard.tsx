
import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { Button } from './Button';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface AdminDashboardProps {
  posts: Post[];
  onDeletePost: (postId: string) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ posts, onDeletePost, onResetData, onClose }) => {
  const totalLikes = posts.reduce((acc, post) => acc + post.likes, 0);
  const totalComments = posts.reduce((acc, post) => acc + post.comments.length, 0);
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, percentage: 0 });

  useEffect(() => {
    const fetchStorage = async () => {
        const { usage, quota } = await dbService.getStorageEstimate();
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        setStorageInfo({ usage, quota, percentage });
    };
    fetchStorage();
  }, [posts]);

  const handleLogout = async () => {
    if (auth && window.confirm("Yönetici oturumunu kapatmak istediğinize emin misiniz?")) {
        await signOut(auth);
        onClose();
        window.location.reload();
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Yönetici Paneli</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400">İçerikleri buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button onClick={onResetData} variant="outline" className="text-[10px] !py-2 !px-4 border-gray-200 dark:border-zinc-800 text-gray-400">Verileri Sıfırla</Button>
            <Button onClick={onClose} variant="secondary" className="text-[10px] !py-2 !px-4">Panele Dön</Button>
            <button 
                onClick={handleLogout}
                className="text-[10px] font-bold px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-full hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
            >
                Çıkış Yap
            </button>
        </div>
      </div>

      {/* Storage Indicator */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disk Kullanımı</span>
            <span className="text-xs font-bold text-wedding-500">
                {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
            </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
                className="h-full rounded-full bg-wedding-500 transition-all duration-500"
                style={{ width: `${Math.max(1, storageInfo.percentage)}%` }}
            ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800">
           <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Gönderi</div>
           <div className="text-2xl font-bold dark:text-white">{posts.length}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800">
           <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Beğeni</div>
           <div className="text-2xl font-bold dark:text-white">{totalLikes}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Medya</th>
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">Açıklama</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <img src={post.media[0].url} className="w-10 h-10 object-cover rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold dark:text-white">{post.user.name}</div>
                    <div className="text-[10px] text-gray-400">{new Date(post.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate dark:text-gray-400">{post.caption}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDeletePost(post.id)} className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase tracking-widest">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
