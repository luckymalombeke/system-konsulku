import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { StatusBadge } from '../../components/StatusBadge';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { Clock, Calendar, Tag } from 'lucide-react';
import { getAppointments, cancelAppointment } from '../../api';

const tabs = ['Aktif', 'Riwayat', 'Semua'];

export default function RiwayatAppointment() {
  const [activeTab, setActiveTab] = useState('Semua');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApts = async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApts();
  }, []);

  const handleCancel = async (id) => {
    const alasan = window.prompt("Masukkan alasan pembatalan:");
    if (alasan === null) return; // User cancelled prompt
    
    if (!alasan.trim()) {
      alert("Alasan pembatalan wajib diisi.");
      return;
    }

    try {
      await cancelAppointment(id, alasan);
      alert("Appointment berhasil dibatalkan.");
      fetchApts(); // Refresh list
    } catch (err) {
      alert("Gagal membatalkan: " + err.message);
    }
  };

  return (
    <Layout variant="mahasiswa">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointment Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola semua jadwal konsultasi tatap muka Anda.</p>
        </div>
        <Link to="/mahasiswa/appointment/buat" className="btn-primary flex items-center gap-2" id="btn-buat-baru">
          <Calendar size={16} />
          Buat Appointment Baru
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#4A1D8F] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            id={`tab-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card mb-5 flex flex-wrap gap-3">
        <select className="input-field w-auto min-w-[140px]" id="filter-status">
          <option>Semua Status</option>
          <option>Pending</option>
          <option>Accepted</option>
          <option>Rejected</option>
          <option>Selesai</option>
        </select>
        <input type="date" className="input-field w-auto" defaultValue="2025-04-19" id="filter-date" />
        <select className="input-field w-auto min-w-[140px]" id="filter-jenis">
          <option>Semua Jenis</option>
          <option>Online</option>
          <option>Offline</option>
        </select>
      </div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat data appointment...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada appointment.</div>
        ) : (
          appointments.map(apt => {
            const dosenName = apt.dosen?.nama_lengkap || 'Dosen';
            const borderColors = {
              'Pending': 'border-orange-400',
              'Accepted': 'border-green-500',
              'Rejected': 'border-red-500',
              'Selesai': 'border-gray-300',
            };
            const borderColor = borderColors[apt.status] || 'border-gray-200';
            
            return (
              <div key={apt.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${borderColor} border border-gray-100`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AvatarPlaceholder size={42} />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{dosenName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Dosen Pembimbing</div>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} label={apt.status} />
                </div>

                <div className="mb-2">
                  <div className="font-semibold text-gray-900 mb-1">{apt.topik}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{apt.deskripsi}</div>
                </div>

                <div className="flex items-center gap-5 mt-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={13} />
                    <span>{apt.tanggal_request} &bull; {apt.jam_request}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag size={13} className="text-gray-400" />
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${apt.jenis === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {apt.jenis}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    {(apt.status === 'Pending' || apt.status === 'pending') && (
                      <button 
                        onClick={() => handleCancel(apt.id)}
                        className="text-sm text-red-600 font-semibold hover:text-red-800 transition-colors"
                      >
                        Batalkan
                      </button>
                    )}
                    <Link to={`/mahasiswa/appointment/${apt.id}`} className="text-sm text-[#4A1D8F] font-semibold hover:underline" id={`link-detail-apt-${apt.id}`}>
                      Detail →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
