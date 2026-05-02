import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { BellOff, Bell, Calendar, MessageSquare, CheckCircle, XCircle, Info } from 'lucide-react';
import { getNotifications, markNotificationsAsRead } from '../../api';

export default function NotifikasiMahasiswa() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
      // Setelah fetch, tandai semua sebagai sudah dibaca
      if (data.length > 0 && data.some(n => !n.is_read)) {
        await markNotificationsAsRead();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'appointment_rejected': return <XCircle className="text-red-500" />;
      case 'appointment_accepted': return <CheckCircle className="text-green-500" />;
      case 'appointment_completed': return <CheckCircle className="text-blue-500" />;
      case 'new_message': return <MessageSquare className="text-purple-500" />;
      default: return <Info className="text-gray-400" />;
    }
  };

  return (
    <Layout variant="mahasiswa">
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                {notifications.length} Total
            </span>
        </div>
        
        {isLoading ? (
            <div className="text-center py-20 text-gray-400">Memuat notifikasi...</div>
        ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellOff size={30} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Notifikasi</h3>
                <p className="text-sm text-gray-500">Anda akan menerima pemberitahuan di sini saat ada pembaruan pada appointment Anda.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-md flex gap-4 ${notif.is_read ? 'border-gray-100 opacity-80' : 'border-[#4A1D8F]/20 shadow-sm'}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.is_read ? 'bg-gray-50' : 'bg-[#4A1D8F]/5'}`}>
                            {getIcon(notif.tipe)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className={`text-sm font-bold ${notif.is_read ? 'text-gray-700' : 'text-[#4A1D8F]'}`}>
                                    {notif.judul}
                                </h4>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(notif.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {notif.pesan}
                            </p>
                        </div>
                        {!notif.is_read && (
                            <div className="w-2 h-2 bg-red-500 rounded-full self-center"></div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </Layout>
  );
}
