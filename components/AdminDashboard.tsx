
import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { Button } from './Button';
import { dbService } from '../services/db';

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
        // Eğer quota 0 dönerse (bazı tarayıcılar privacy mode'da vermeyebilir) %0 göster
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        setStorageInfo({ usage, quota, percentage });
    };
    fetchStorage();
  }, [posts]); // Posts değişince güncelle

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
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-serif font-bold text-gray-900">Yönetici Paneli</h2>
           <p className="text-sm text-gray-500">İçerikleri buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={onResetData} variant="outline" className="text-xs !py-1">Verileri Sıfırla</Button>
            <Button onClick={onClose} variant="secondary">Panele Dön</Button>
        </div>
      </div>

      {/* Storage Indicator (IndexedDB Version) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Disk Kullanımı</span>
            <span className="text-xs font-bold text-green-600">
                {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)} (Boş Alanın ~%80'i)
            </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div 
                className="h-2.5 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.max(1, storageInfo.percentage)}%` }} // En az %1 görünsün ki çalıştığı anlaşılsın
            ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
            Veriler tarayıcınızın <b>IndexedDB</b> alanında saklanmaktadır. Bu alan cihazınızın boş disk alanına göre belirlenir (Genellikle GB'larca yeriniz var).
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Toplam Gönderi</div>
           <div className="text-2xl font-bold text-wedding-900">{posts.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Toplam Beğeni</div>
           <div className="text-2xl font-bold text-wedding-900">{totalLikes}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Toplam Yorum</div>
           <div className="text-2xl font-bold text-wedding-900">{totalComments}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Medya</th>
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">Açıklama</th>
                <th className="px-6 py-4">İstatistikler</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img 
                      src={post.media[0].url} 
                      alt="Thumbnail" 
                      className="w-12 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{post.user.name}</div>
                    <div className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleDateString('tr-TR')}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="truncate">{post.caption}</p>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex gap-3">
                        <span className="flex items-center gap-1"><span className="text-xs">❤️</span> {post.likes}</span>
                        <span className="flex items-center gap-1"><span className="text-xs">💬</span> {post.comments.length}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDeletePost(post.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-medium text-xs border border-red-200 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">Hiç gönderi bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
