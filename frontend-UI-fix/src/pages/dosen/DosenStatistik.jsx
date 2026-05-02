import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { Download, Trophy, Users, MessageSquare, TrendingUp, Percent, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getDosenStats } from '../../api';

const PIE_COLORS = ['#4A1D8F', '#A78BFA'];

const statusBadgeMap = {
  'Sangat Aktif': 'bg-indigo-100 text-indigo-700',
  'Aktif': 'bg-green-100 text-green-700',
  'Cukup': 'bg-blue-100 text-blue-700',
  'Perlu Perhatian': 'bg-orange-100 text-orange-700',
  'Tidak Aktif': 'bg-red-100 text-red-600',
};

export default function DosenStatistik() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPill, setFilterPill] = useState('Semua');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDosenStats();
        setStats(data);
      } catch (err) {
        console.error("Gagal mengambil statistik:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Layout variant="dosen">
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
          <Loader2 className="animate-spin mb-2" size={40} />
          <p>Memuat data statistik...</p>
        </div>
      </Layout>
    );
  }

  if (!stats) return <Layout variant="dosen">Error loading stats</Layout>;

  const statCards = [
    { icon: Users, label: 'Mahasiswa Dibimbing', value: stats.total_mahasiswa, border: 'border-[#4A1D8F]', iconBg: 'bg-purple-100', iconColor: 'text-[#4A1D8F]' },
    { icon: MessageSquare, label: 'Total Konsultasi', value: stats.total_konsultasi, border: 'border-blue-400', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { icon: TrendingUp, label: 'Rata-rata / Mahasiswa', value: stats.avg_per_mhs, border: 'border-green-400', iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { icon: Percent, label: 'Tingkat Respons', value: stats.response_rate, border: 'border-orange-400', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
  ];

  // Convert monthly data format for Chart
  const chartMonthlyData = (stats.monthly_data || []).map(d => ({
    month: d.Month.split('-')[1] === '01' ? 'Jan' : 
           d.Month.split('-')[1] === '02' ? 'Feb' :
           d.Month.split('-')[1] === '03' ? 'Mar' :
           d.Month.split('-')[1] === '04' ? 'Apr' :
           d.Month.split('-')[1] === '05' ? 'Mei' :
           d.Month.split('-')[1] === '06' ? 'Jun' :
           d.Month.split('-')[1] === '07' ? 'Jul' :
           d.Month.split('-')[1] === '08' ? 'Agu' :
           d.Month.split('-')[1] === '09' ? 'Sep' :
           d.Month.split('-')[1] === '10' ? 'Okt' :
           d.Month.split('-')[1] === '11' ? 'Nov' : 'Des',
    total: d.Total
  })).reverse();

  // Pie chart handling
  const pieData = stats.pie_data.map(d => ({
    name: d.name,
    value: parseInt(d.value)
  }));

  const totalPie = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Layout variant="dosen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Statistik Konsultasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Data asli berdasarkan aktivitas janji temu Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="border border-[#4A1D8F] text-[#4A1D8F] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#F0E9FF] transition-colors flex items-center gap-2" 
            onClick={() => window.print()}
          >
            <Download size={15} />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 border-t-4 ${card.border}`}>
            <div className={`${card.iconBg} p-2 rounded-lg w-fit mb-3`}>
              <card.icon size={20} className={card.iconColor} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 mb-6">
        {/* Bar Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Tren Konsultasi Bulanan</h3>
          {chartMonthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartMonthlyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  cursor={{ fill: '#F0E9FF' }}
                />
                <Bar dataKey="total" fill="#4A1D8F" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm italic">Belum ada data bulanan</div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Jenis Konsultasi</h3>
          {totalPie > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm italic">Belum ada data jenis</div>
          )}
        </div>
      </div>

      {/* Peringkat Mahasiswa */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Top Mahasiswa Aktif
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium first:rounded-l-lg">Mahasiswa</th>
                <th className="text-left px-4 py-3 font-medium">Prodi</th>
                <th className="text-center px-4 py-3 font-medium">Online</th>
                <th className="text-center px-4 py-3 font-medium">Offline</th>
                <th className="text-center px-4 py-3 font-medium last:rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.rankings.length > 0 ? stats.rankings.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-100 hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                        <div>
                            <div>{row.name}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{row.nim}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.prodi}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.online}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.offline}</td>
                  <td className="px-4 py-3 text-center text-[#4A1D8F] font-bold">{row.total}</td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan="5" className="py-10 text-center text-gray-400 italic">Belum ada data mahasiswa bimbingan.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
