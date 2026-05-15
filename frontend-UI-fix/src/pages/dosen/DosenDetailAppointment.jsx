import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { StatusBadge } from '../../components/StatusBadge';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { ChevronLeft, Clock, Calendar, Check, Paperclip } from 'lucide-react';
import { getAppointmentByID, acceptAppointment, rejectAppointment, completeAppointment, API_BASE_URL } from '../../api';

export default function DosenDetailAppointment() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catatan, setCatatan] = useState('');

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

  if (isLoading) return <Layout variant="dosen"><div className="p-10 text-center">Memuat detail...</div></Layout>;
  if (error) return <Layout variant="dosen"><div className="p-10 text-center text-red-500">Error: {error}</div></Layout>;
  if (!appointment) return <Layout variant="dosen"><div className="p-10 text-center">Data tidak ditemukan.</div></Layout>;

  const detailData = {
    mahasiswa: appointment.mahasiswa?.nama_lengkap || 'Mahasiswa',
    nim: appointment.mahasiswa?.nim || '-',
    prodi: 'Sistem Informasi',
    semester: appointment.mahasiswa?.semester || '-',
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
    timeline.push({ label: 'Dibatalkan Mahasiswa', date: appointment.UpdatedAt?.split('T')[0] || '-', done: true });
  } else if (appointment.status === 'rejected') {
    timeline.push({ label: 'Ditolak', date: appointment.UpdatedAt?.split('T')[0] || '-', done: true });
  } else {
    const isPending = appointment.status === 'pending' || appointment.status === 'Menunggu';
    const isAccepted = appointment.status === 'Accepted' || appointment.status === 'Selesai';
    const isDone = appointment.status === 'Selesai';

    timeline.push({
      label: 'Dosen Merespons',
      date: isPending ? 'Belum direspons' : 'Sudah direspons',
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
    <Layout variant="dosen">
      <div className="mb-5">
        <Link to="/dosen/appointment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4A1D8F] mb-4 w-fit" id="link-back">
          <ChevronLeft size={16} />
          Kembali ke Daftar
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Detail Appointment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left */}
        <div className="card space-y-5">
          {/* Mahasiswa Info */}
          <div className="bg-[#F0E9FF] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <AvatarPlaceholder size={56} />
              <div>
                <div className="font-semibold text-gray-900">{detailData.mahasiswa}</div>
                <div className="text-xs text-gray-500 mt-0.5">{detailData.nim} · {detailData.prodi}</div>
                <div className="text-xs text-[#4A1D8F] font-medium mt-0.5">Semester {detailData.semester}</div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tanggal', value: detailData.tanggal, icon: <Calendar size={13} /> },
              { label: 'Waktu', value: detailData.jam, icon: <Clock size={13} /> },
              { label: 'Jenis', value: detailData.jenis, icon: null },
              { label: 'Status', value: detailData.status, icon: null },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  {icon && <span className="text-[#4A1D8F]">{icon}</span>}
                  {label}
                </div>
                <div className="text-sm font-medium text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Topik</div>
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

        {/* Right */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Status Konsultasi</h3>
          {/* Timeline */}
          <div className="relative mb-6">
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {timeline.map((step) => (
                <div key={step.label} className="flex items-start gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${step.done ? 'bg-[#4A1D8F]' : 'bg-white border-2 border-gray-300'}`}>
                    {step.done && <Check size={13} className="text-white" />}
                  </div>
                  <div className="pb-2">
                    <div className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <button
              onClick={async () => {
                try {
                  await completeAppointment(id, catatan);
                  alert("Konsultasi berhasil ditandai selesai!");
                  window.location.reload();
                } catch (err) {
                  alert("Gagal: " + err.message);
                }
              }}
              className="w-full bg-[#059669] text-white rounded-lg py-2.5 font-semibold hover:bg-green-700 transition-colors" id="btn-tandai-selesai"
            >
              Tandai Selesai
            </button>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Catat Hasil Konsultasi</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="input-field resize-none h-24 w-full border border-gray-200 rounded p-2"
                placeholder="Tulis catatan hasil konsultasi untuk mahasiswa..."
              />
            </div>
            <button className="w-full btn-outlined" id="btn-simpan-catatan" onClick={() => alert("Gunakan tombol Tandai Selesai untuk menyimpan catatan dan menyelesaikan appointment sekaligus.")}>
              Simpan Catatan
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
