import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { StatCard } from '../../components/StatCard';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { StatusBadge } from '../../components/StatusBadge';
import { Clock, X, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { getAppointments, rejectAppointment } from '../../api';

export default function DosenKelolAppointment() {
  const [activeTab, setActiveTab] = useState('Pending');
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApts = async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApts();
  }, []);

  const handleReject = async () => {
    if (!alasanTolak.trim()) {
      alert("Alasan penolakan wajib diisi");
      return;
    }
    try {
      await rejectAppointment(selectedId, alasanTolak);
      setShowTolakModal(false);
      setAlasanTolak('');
      fetchApts();
      alert("Berhasil menolak request");
    } catch (err) {
      alert("Gagal menolak: " + err.message);
    }
  };

  const filteredApts = appointments.filter(a => {
    if (activeTab === 'Pending') return a.status === 'Pending' || a.status === 'pending';
    if (activeTab === 'Terjadwal') return a.status === 'Accepted' || a.status === 'accepted';
    if (activeTab === 'Selesai') return a.status === 'Selesai' || a.status === 'selesai';
    if (activeTab === 'Ditolak') return a.status === 'Rejected' || a.status === 'rejected';
    return false;
  });

  const tabs = [
    { label: 'Pending', count: appointments.filter(a => a.status === 'Pending' || a.status === 'pending').length },
    { label: 'Terjadwal', count: appointments.filter(a => a.status === 'Accepted' || a.status === 'accepted').length },
    { label: 'Selesai', count: appointments.filter(a => a.status === 'Selesai' || a.status === 'selesai').length },
    { label: 'Ditolak', count: appointments.filter(a => a.status === 'Rejected' || a.status === 'rejected').length },
  ];

  return (
    <Layout variant="dosen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Appointment</h1>
          <p className="text-gray-500 text-sm">Lihat dan konfirmasi permintaan konsultasi mahasiswa</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === tab.label ? 'text-[#4A1D8F]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-[#4A1D8F] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
            {activeTab === tab.label && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A1D8F]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Memuat data...</div>
        ) : filteredApts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-gray-400 mb-2">📭</div>
            <p className="text-gray-500 text-sm italic">Tidak ada appointment dengan status {activeTab}</p>
          </div>
        ) : (
          filteredApts.map(req => (
            <div key={req.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AvatarPlaceholder size={44} />
                  <div>
                    <div className="font-bold text-gray-900">{req.mahasiswa?.nama_lengkap || 'Mahasiswa'}</div>
                    <div className="text-xs text-gray-400">NIM: {req.mahasiswa?.nim || '-'}</div>
                  </div>
                </div>
                <StatusBadge status={req.status} label={req.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Topik</div>
                  <div className="text-sm font-semibold text-gray-800">{req.topik}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Waktu</div>
                  <div className="text-sm font-semibold text-[#4A1D8F] flex items-center gap-2">
                    <CalendarIcon size={14} /> {req.tanggal_request} | <Clock size={14} /> {req.jam_request}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Deskripsi</div>
                <p className="text-sm text-gray-600 line-clamp-2">{req.deskripsi}</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <Link 
                  to={`/dosen/appointment/${req.id}`}
                  className="text-sm font-bold text-[#4A1D8F] hover:underline"
                >
                  Detail Mahasiswa
                </Link>
                
                {activeTab === 'Pending' && (
                  <div className="ml-auto flex items-center gap-3">
                    <button 
                      onClick={() => { setSelectedId(req.id); setShowTolakModal(true); }}
                      className="text-red-500 text-sm font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Tolak
                    </button>
                    <button className="bg-[#4A1D8F] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#3A1572] transition-colors shadow-lg shadow-[#4A1D8F]/20">
                      Terima Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tolak Modal */}
      {showTolakModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-red-600">Tolak Request</h3>
              <button onClick={() => setShowTolakModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Alasan penolakan <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all h-28 resize-none" 
                placeholder="Berikan alasan agar mahasiswa paham..." 
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTolakModal(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button 
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Tolak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
