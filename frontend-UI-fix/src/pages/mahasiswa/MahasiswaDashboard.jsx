import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { MessageSquare, Clock, Calendar, CheckCircle, MessageCircle } from 'lucide-react';
import { getAppointments } from '../../api';

export default function MahasiswaDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error("Gagal mengambil data dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

  // Statistik Real
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Pending' || a.status === 'pending').length;
  const ongoingCount = appointments.filter(a => a.status === 'Accepted' || a.status === 'accepted').length;
  const finishedCount = appointments.filter(a => a.status === 'Selesai' || a.status === 'selesai').length;

  const recentApts = appointments.slice(0, 5);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout variant="mahasiswa">
      <div className="animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#3A1572] via-[#4A1D8F] to-[#6B2FBF] rounded-2xl p-8 text-white mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-[#3A1572]/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 right-20 w-32 h-32 bg-[#FFD700]/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold mb-1 drop-shadow-sm">Selamat datang, {user?.nama_lengkap || 'Mahasiswa'}! 👋</h2>
            <p className="text-white/80 text-sm font-medium">{user?.no_induk || '-'} <span className="opacity-50 mx-2">|</span> {today}</p>
          </div>
          <div className="flex gap-3 flex-wrap relative z-10">
            <Link to="/mahasiswa/konsultasi-online" className="bg-[#FFD700] text-[#3A1572] rounded-xl py-2.5 px-5 font-bold text-sm shadow-lg shadow-[#FFD700]/20 hover:scale-105 transition-all duration-300 whitespace-nowrap">
              Mulai Konsultasi Online
            </Link>
            <Link to="/mahasiswa/appointment" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl py-2.5 px-5 font-bold text-sm hover:bg-white/20 hover:scale-105 transition-all duration-300 whitespace-nowrap">
              Buat Appointment
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={MessageSquare} value={totalCount.toString()} label="Total Konsultasi" borderColor="border-[#4A1D8F]" iconBg="bg-purple-100" iconColor="text-[#4A1D8F]" />
          <StatCard icon={Clock} value={ongoingCount.toString()} label="Sedang Berjalan" borderColor="border-yellow-400" iconBg="bg-yellow-50" iconColor="text-yellow-500" />
          <StatCard icon={Calendar} value={pendingCount.toString()} label="Appointment Pending" borderColor="border-orange-400" iconBg="bg-orange-50" iconColor="text-orange-500" />
          <StatCard icon={CheckCircle} value={finishedCount.toString()} label="Konsultasi Selesai" borderColor="border-green-500" iconBg="bg-green-50" iconColor="text-green-600" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Left: Tabel Konsultasi */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Konsultasi Terbaru</h3>
              <Link to="/mahasiswa/appointment" className="text-sm text-[#4A1D8F] font-medium hover:underline">Lihat Semua →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="text-left px-3 py-3 rounded-l-lg font-medium">Dosen</th>
                    <th className="text-left px-3 py-3 font-medium">Topik</th>
                    <th className="text-left px-3 py-3 font-medium">Tanggal</th>
                    <th className="text-left px-3 py-3 font-medium">Status</th>
                    <th className="text-left px-3 py-3 rounded-r-lg font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="text-center py-6 text-gray-400 italic">Memuat data...</td></tr>
                  ) : recentApts.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-gray-400 italic">Belum ada konsultasi</td></tr>
                  ) : recentApts.map(item => (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3.5 font-medium text-gray-900 whitespace-nowrap">{item.dosen?.nama_lengkap || 'Dosen'}</td>
                      <td className="px-3 py-3.5 text-gray-600 max-w-[160px] truncate">{item.topik}</td>
                      <td className="px-3 py-3.5 text-gray-500 whitespace-nowrap text-xs">{item.tanggal_request}</td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={item.status} label={item.status} />
                      </td>
                      <td className="px-3 py-3.5">
                        <Link to={`/mahasiswa/appointment/${item.id}`} className="text-[#4A1D8F] font-medium hover:underline text-xs">Detail</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle size={16} className="text-[#4A1D8F]" />
                Dosen
              </h3>
              <p className="text-xs text-gray-400 italic">Gunakan menu Konsultasi Online untuk mencari dosen.</p>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">📢 Pengumuman</h3>
              <div className="text-xs text-gray-400 italic">Belum ada pengumuman terbaru.</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
