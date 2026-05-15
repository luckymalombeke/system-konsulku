import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { StatusBadge } from '../../components/StatusBadge';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { ChevronLeft, Clock, Calendar, Tag, Paperclip, Check } from 'lucide-react';
import { getAppointmentByID, API_BASE_URL } from '../../api';

export default function DetailAppointment() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await getAppointmentByID(id);
        setAppointment(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (isLoading) return <Layout variant="mahasiswa"><div className="p-10 text-center">Memuat detail...</div></Layout>;
  if (error) return <Layout variant="mahasiswa"><div className="p-10 text-center text-red-500">Error: {error}</div></Layout>;
  if (!appointment) return <Layout variant="mahasiswa"><div className="p-10 text-center">Data tidak ditemukan.</div></Layout>;

  const detailData = {
    dosen: appointment.dosen?.nama_lengkap || 'Dosen',
    dosenProdi: 'Sistem Informasi',
    dosenNip: appointment.dosen?.nip || '-',
    topik: appointment.topik,
    desc: appointment.deskripsi,
    tanggal: appointment.tanggal_request,
    jam: appointment.jam_request,
    jenis: appointment.jenis || 'Offline',
    status: appointment.status,
    lampiran: appointment.lampiran_url ? appointment.lampiran_url : null,
  };

  const timeline = [];
  timeline.push({ label: 'Request Dikirim', date: appointment.CreatedAt?.split('T')[0] || '-', done: true });

  if (appointment.status === 'cancelled') {
    timeline.push({ label: 'Dibatalkan', date: appointment.UpdatedAt?.split('T')[0] || '-', done: true });
  } else if (appointment.status === 'rejected') {
    timeline.push({ label: 'Ditolak oleh Dosen', date: appointment.UpdatedAt?.split('T')[0] || '-', done: true });
  } else {
    const isPending = appointment.status === 'pending' || appointment.status === 'Menunggu';
    const isAccepted = appointment.status === 'Accepted' || appointment.status === 'Selesai';
    const isDone = appointment.status === 'Selesai';

    timeline.push({ 
      label: 'Dosen Merespons', 
      date: isPending ? 'Menunggu respons dosen...' : 'Sudah direspons', 
      done: !isPending 
    });
    timeline.push({ 
      label: 'Jadwal Dikonfirmasi', 
      date: isAccepted ? 'Terkonfirmasi' : '-', 
      done: isAccepted 
    });
    timeline.push({ 
      label: 'Konsultasi Selesai', 
      date: isDone ? appointment.UpdatedAt?.split('T')[0] : '-', 
      done: isDone 
    });
  }
  return (
    <Layout variant="mahasiswa">
      <div className="mb-5">
        <Link to="/mahasiswa/appointment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4A1D8F] mb-4 w-fit" id="link-back">
          <ChevronLeft size={16} />
          Kembali ke Daftar Appointment
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Detail Appointment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
        {/* Left: Detail Card */}
        <div className="card space-y-5">
          {/* Dosen Info */}
          <div className="flex items-center gap-4 p-4 bg-[#F0E9FF] rounded-xl">
            <AvatarPlaceholder size={56} />
            <div>
              <div className="font-semibold text-gray-900">{detailData.dosen}</div>
              <div className="text-xs text-[#4A1D8F] font-medium mt-0.5">{detailData.dosenProdi}</div>
              <div className="text-xs text-gray-400 mt-0.5">{detailData.dosenNip}</div>
            </div>
            <div className="ml-auto">
              <StatusBadge status={detailData.status} label={detailData.status} />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tanggal', value: detailData.tanggal, icon: <Calendar size={14} className="text-[#4A1D8F]" /> },
              { label: 'Waktu', value: detailData.jam, icon: <Clock size={14} className="text-[#4A1D8F]" /> },
              { label: 'Jenis Konsultasi', value: detailData.jenis, icon: <Tag size={14} className="text-[#4A1D8F]" /> },
              { label: 'Status', value: detailData.status, icon: <Check size={14} className="text-[#4A1D8F]" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">{icon}{label}</div>
                <div className="text-sm font-medium text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Topik Konsultasi</div>
            <div className="font-semibold text-gray-900">{detailData.topik}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Deskripsi</div>
            <p className="text-sm text-gray-600 leading-relaxed">{detailData.desc}</p>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Lampiran</div>
            {detailData.lampiran ? (
              <a 
                href={`${API_BASE_URL}${detailData.lampiran}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 border border-[#4A1D8F]/20 bg-[#F0E9FF]/50 hover:bg-[#F0E9FF] rounded-lg p-3 w-fit cursor-pointer transition-colors"
              >
                <Paperclip size={16} className="text-[#4A1D8F]" />
                <span className="text-sm text-[#4A1D8F] font-medium underline">Buka Lampiran File</span>
              </a>
            ) : (
              <div className="flex items-center gap-3 border border-gray-200 bg-gray-50 rounded-lg p-3 w-fit">
                <span className="text-sm text-gray-400 font-medium">Tidak ada lampiran</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Status Konsultasi</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-start gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                    step.done ? 'bg-[#4A1D8F]' : 'bg-white border-2 border-gray-300'
                  }`}>
                    {step.done && <Check size={13} className="text-white" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reschedule Proposal */}
          {appointment.status === 'Reschedule' && appointment.reschedule_tanggal && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="text-sm font-semibold text-orange-700 mb-1">Usulan Reschedule</div>
              <p className="text-xs text-orange-600 mb-3">Dosen mengusulkan jadwal baru: <strong>{appointment.reschedule_tanggal}, {appointment.reschedule_jam} WITA</strong></p>
              <div className="flex gap-2">
                <button className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 transition-colors" id="btn-setuju">Setuju</button>
                <button className="flex-1 border border-red-400 text-red-600 rounded-lg py-2 text-sm font-medium hover:bg-red-50 transition-colors" id="btn-tolak">Tolak</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
