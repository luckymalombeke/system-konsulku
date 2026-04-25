import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { StatCard } from '../../components/StatCard';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { StatusBadge } from '../../components/StatusBadge';
import { Users, MessageSquare, Calendar, CheckCircle, Activity } from 'lucide-react';
import { getAppointments } from '../../api';

export default function DosenDashboard() {
  const [tersedia, setTersedia] = useState(true);
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

  // Hitung Statistik Real
  const pendingCount = appointments.filter(a => a.status === 'Pending' || a.status === 'pending').length;
  const finishedCount = appointments.filter(a => a.status === 'Selesai' || a.status === 'selesai').length;
  const recentRequests = appointments
    .filter(a => a.status === 'Pending' || a.status === 'pending')
    .slice(0, 5);
  
  const todayApts = appointments.filter(a => {
    const todayStr = new Date().toISOString().split('T')[0];
    return a.tanggal_request === todayStr && (a.status === 'Accepted' || a.status === 'accepted');
  });

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout variant="dosen">
      {/* Welcome Banner */}
      <div className="bg-[#3A1572] rounded-xl p-6 text-white mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Selamat datang, {user?.nama_lengkap || 'Dosen'} 👋</h2>
          <p className="text-white/70 text-sm">{user?.no_induk || '-'} &nbsp;|&nbsp; {today}</p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
          <div>
            <div className={`text-xs font-semibold mb-0.5 ${tersedia ? 'text-green-300' : 'text-gray-300'}`}>
              {tersedia ? 'Tersedia' : 'Tidak Tersedia'}
            </div>
            <div className="text-white/60 text-xs">untuk konsultasi</div>
          </div>
          <button
            onClick={() => setTersedia(!tersedia)}
            className={`relative w-12 h-6 rounded-full transition-colors ${tersedia ? 'bg-green-400' : 'bg-gray-500'}`}
            id="toggle-tersedia"
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${tersedia ? 'left-7' : 'left-1'}`}></span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value="-" label="Mahasiswa Aktif" borderColor="border-[#4A1D8F]" iconBg="bg-purple-100" iconColor="text-[#4A1D8F]" />
        <StatCard icon={MessageSquare} value="0" label="Chat Belum Dibaca" borderColor="border-blue-400" iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard icon={Calendar} value={pendingCount.toString()} label="Appointment Pending" borderColor="border-orange-400" iconBg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard icon={CheckCircle} value={finishedCount.toString()} label="Selesai Bulan Ini" borderColor="border-green-500" iconBg="bg-green-50" iconColor="text-green-600" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Request Appointment Terbaru</h3>
              <Link to="/dosen/appointment" className="text-sm text-[#4A1D8F] font-medium hover:underline">Lihat Semua →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="text-left px-3 py-3 rounded-l-lg font-medium">Mahasiswa</th>
                    <th className="text-left px-3 py-3 font-medium">Topik</th>
                    <th className="text-left px-3 py-3 font-medium">Tgl Request</th>
                    <th className="text-left px-3 py-3 rounded-r-lg font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="4" className="text-center py-4 text-gray-400 italic">Memuat data...</td></tr>
                  ) : recentRequests.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-4 text-gray-400 italic">Tidak ada permintaan baru</td></tr>
                  ) : recentRequests.map(r => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <AvatarPlaceholder size={28} />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{r.mahasiswa?.nama_lengkap || 'Mahasiswa'}</div>
                            <div className="text-xs text-gray-400">{r.mahasiswa?.nim || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 max-w-[140px] truncate text-gray-600">{r.topik}</td>
                      <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">{r.tanggal_request}</td>
                      <td className="px-3 py-3.5">
                        <Link to="/dosen/appointment" className="bg-[#4A1D8F] text-white text-[10px] rounded px-2 py-1 hover:bg-[#3A1572] font-medium">Kelola</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Chat Aktif</h3>
            <div className="text-center py-6 text-gray-400 text-xs italic">Belum ada percakapan aktif</div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Jadwal Hari Ini</h3>
            <div className="space-y-3">
              {todayApts.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-xs italic">Tidak ada jadwal hari ini</div>
              ) : todayApts.map(j => (
                <div key={j.id} className="flex items-start gap-3">
                  <span className="text-xs font-medium text-[#4A1D8F] bg-[#F0E9FF] px-2 py-1 rounded-lg w-14 text-center flex-shrink-0">{j.jam_request}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{j.mahasiswa?.nama_lengkap}</div>
                    <div className="text-xs text-gray-500">{j.topik}</div>
                  </div>
                  <StatusBadge status={j.status} label={j.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[#4A1D8F]" />
              Aktivitas Terkini
            </h3>
            <div className="text-center py-4 text-gray-400 text-xs italic">Belum ada aktivitas terbaru</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
