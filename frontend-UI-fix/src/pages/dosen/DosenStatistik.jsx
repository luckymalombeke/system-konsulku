import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { Download, Trophy, Users, MessageSquare, TrendingUp, Percent } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const monthlyData = [
  { month: 'Jan', total: 14 }, { month: 'Feb', total: 19 }, { month: 'Mar', total: 22 },
  { month: 'Apr', total: 17 }, { month: 'Mei', total: 28 }, { month: 'Jun', total: 24 },
  { month: 'Jul', total: 8 }, { month: 'Agu', total: 12 }, { month: 'Sep', total: 30 },
  { month: 'Okt', total: 27 }, { month: 'Nov', total: 35 }, { month: 'Des', total: 21 },
];

const pieData = [
  { name: 'Online', value: 68 },
  { name: 'Offline', value: 32 },
];

const PIE_COLORS = ['#4A1D8F', '#A78BFA'];

const mahasiswaData = [
  { rank: 1, name: 'Andi Saputra', nim: '20210001', prodi: 'SI', online: 8, offline: 4, total: 12, pct: 100, status: 'Sangat Aktif' },
  { rank: 2, name: 'Lina Mokorimban', nim: '20210045', prodi: 'SI', online: 7, offline: 3, total: 10, pct: 83, status: 'Sangat Aktif' },
  { rank: 3, name: 'Benny Lumintang', nim: '20200088', prodi: 'MI', online: 5, offline: 4, total: 9, pct: 75, status: 'Aktif' },
  { rank: 4, name: 'Cindy Rompas', nim: '20210090', prodi: 'SI', online: 6, offline: 2, total: 8, pct: 67, status: 'Aktif' },
  { rank: 5, name: 'Tresia Tumewu', nim: '20210102', prodi: 'TI', online: 4, offline: 3, total: 7, pct: 58, status: 'Aktif' },
  { rank: 6, name: 'Kevin Pondaag', nim: '20210078', prodi: 'TI', online: 3, offline: 3, total: 6, pct: 50, status: 'Cukup' },
  { rank: 7, name: 'Yolanda Sambiran', nim: '20200034', prodi: 'MI', online: 4, offline: 1, total: 5, pct: 42, status: 'Cukup' },
  { rank: 8, name: 'Samuel Wuisan', nim: '20210111', prodi: 'SI', online: 2, offline: 2, total: 4, pct: 33, status: 'Cukup' },
  { rank: 9, name: 'Grace Maringka', nim: '20210055', prodi: 'TI', online: 3, offline: 1, total: 4, pct: 33, status: 'Cukup' },
  { rank: 10, name: 'Fredy Katuuk', nim: '20200067', prodi: 'SI', online: 2, offline: 1, total: 3, pct: 25, status: 'Perlu Perhatian' },
  { rank: 11, name: 'Monica Maengkom', nim: '20210033', prodi: 'MI', online: 1, offline: 1, total: 2, pct: 17, status: 'Perlu Perhatian' },
  { rank: 12, name: 'Dika Wowiling', nim: '20200021', prodi: 'TI', online: 2, offline: 0, total: 2, pct: 17, status: 'Perlu Perhatian' },
  { rank: 13, name: 'Restu Tumurang', nim: '20210120', prodi: 'SI', online: 1, offline: 0, total: 1, pct: 8, status: 'Tidak Aktif' },
  { rank: 14, name: 'Reza Sumakul', nim: '20200009', prodi: 'MI', online: 0, offline: 1, total: 1, pct: 8, status: 'Tidak Aktif' },
  { rank: 15, name: 'Tiara Ponto', nim: '20210140', prodi: 'TI', online: 0, offline: 0, total: 0, pct: 0, status: 'Tidak Aktif' },
];

const perluPerhatian = [
  { name: 'Fredy Katuuk', nim: '20200067', prodi: 'Sistem Informasi' },
  { name: 'Monica Maengkom', nim: '20210033', prodi: 'Manajemen Informatika' },
  { name: 'Tiara Ponto', nim: '20210140', prodi: 'Teknik Informatika' },
];

const statusBadgeMap = {
  'Sangat Aktif': 'bg-indigo-100 text-indigo-700',
  'Aktif': 'bg-green-100 text-green-700',
  'Cukup': 'bg-blue-100 text-blue-700',
  'Perlu Perhatian': 'bg-orange-100 text-orange-700',
  'Tidak Aktif': 'bg-red-100 text-red-600',
};

const statCards = [
  { icon: Users, label: 'Total Mahasiswa Dibimbing', value: '24', border: 'border-[#4A1D8F]', iconBg: 'bg-purple-100', iconColor: 'text-[#4A1D8F]' },
  { icon: MessageSquare, label: 'Total Konsultasi', value: '257', border: 'border-blue-400', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  { icon: TrendingUp, label: 'Rata-rata / Mahasiswa', value: '10.7', border: 'border-green-400', iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  { icon: Percent, label: 'Tingkat Respons', value: '94%', border: 'border-orange-400', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
];

export default function DosenStatistik() {
  const [filterPill, setFilterPill] = useState('Semua');

  return (
    <Layout variant="dosen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Statistik Konsultasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan aktivitas dan performa bimbingan akademik Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field w-auto" id="select-period">
            <option>April 2025</option>
            <option>Maret 2025</option>
            <option>Semester Genap 2024/2025</option>
          </select>
          <button className="border border-[#4A1D8F] text-[#4A1D8F] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#F0E9FF] transition-colors flex items-center gap-2" id="btn-download">
            <Download size={15} />
            Download Laporan
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

      {/* Peringkat Aktivitas */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Peringkat Aktivitas Mahasiswa</h3>
          <div className="flex gap-1">
            {['Semua', 'Online', 'Offline'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPill(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterPill === p ? 'bg-[#4A1D8F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                id={`filter-${p.toLowerCase()}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                {['Rank', 'Mahasiswa', 'Prodi', 'Online', 'Offline', 'Total', 'Aktivitas', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-3 font-medium first:rounded-l-lg last:rounded-r-lg">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mahasiswaData.map(row => (
                <tr
                  key={row.rank}
                  className={`border-t border-gray-100 hover:bg-purple-50 transition-colors ${row.rank <= 3 ? 'border-l-4 border-l-[#4A1D8F]' : ''}`}
                >
                  <td className="px-3 py-3">
                    {row.rank <= 3 ? (
                      <Trophy size={16} className={row.rank === 1 ? 'text-yellow-500' : row.rank === 2 ? 'text-gray-400' : 'text-orange-400'} />
                    ) : (
                      <span className="text-gray-600 font-medium">{row.rank}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <AvatarPlaceholder size={32} />
                      <div>
                        <div className="font-medium text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-400">{row.nim}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{row.prodi}</td>
                  <td className="px-3 py-3 text-gray-900 font-medium">{row.online}</td>
                  <td className="px-3 py-3 text-gray-900 font-medium">{row.offline}</td>
                  <td className="px-3 py-3 text-[#4A1D8F] font-bold">{row.total}</td>
                  <td className="px-3 py-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4A1D8F] rounded-full"
                        style={{ width: `${row.pct}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{row.pct}%</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeMap[row.status] || 'bg-gray-100 text-gray-600'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Tren Konsultasi per Bulan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#F0E9FF' }}
                labelFormatter={(label) => `${label} 2025`}
                formatter={(value) => [value, 'Konsultasi']}
              />
              <Bar dataKey="total" fill="#4A1D8F" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Rasio Online vs Offline</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                outerRadius={90}
                innerRadius={50}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ color: '#374151', fontSize: '13px' }}>{value}</span>}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Persentase']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Perlu Perhatian */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Mahasiswa Perlu Perhatian</h3>
          <span className="text-xs text-gray-500">0 konsultasi bulan ini</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perluPerhatian.map(m => (
            <div key={m.nim} className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <AvatarPlaceholder size={40} />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.nim}</div>
                </div>
              </div>
              <p className="text-sm text-red-600 font-medium mb-3">0 konsultasi bulan ini</p>
              <button className="w-full bg-[#DC2626] text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 transition-colors" id={`btn-reminder-${m.nim}`}>
                Kirim Reminder
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div className="bg-[#F0E9FF] rounded-xl p-5">
        <h3 className="font-semibold text-[#4A1D8F] mb-4">💡 Insight Konsultasi</h3>
        <div className="space-y-3">
          {[
            { color: 'bg-green-500', text: 'Tingkat respons Anda sebesar 94% berada di atas rata-rata dosen (82%). Pertahankan responsivitas ini untuk mendukung mahasiswa.' },
            { color: 'bg-[#4A1D8F]', text: 'Puncak permintaan konsultasi terjadi di bulan November. Pertimbangkan menambah slot konsultasi pada Q4 setiap tahunnya.' },
            { color: 'bg-orange-500', text: '3 mahasiswa belum melakukan konsultasi sama sekali bulan ini. Segera kirim reminder untuk memastikan kelancaran bimbingan mereka.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color} mt-1.5 flex-shrink-0`}></div>
              <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
