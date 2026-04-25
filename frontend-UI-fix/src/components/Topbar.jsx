import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { AvatarPlaceholder } from './AvatarPlaceholder';

const titleMap = {
  '/mahasiswa/dashboard': 'Dashboard',
  '/mahasiswa/konsultasi-online': 'Konsultasi Online',
  '/mahasiswa/appointment/buat': 'Buat Appointment',
  '/mahasiswa/appointment': 'Riwayat Appointment',
  '/mahasiswa/notifikasi': 'Notifikasi',
  '/mahasiswa/profil': 'Profil',
  '/dosen/dashboard': 'Dashboard',
  '/dosen/konsultasi-online': 'Konsultasi Online',
  '/dosen/appointment': 'Kelola Appointment',
  '/dosen/statistik': 'Statistik Konsultasi',
  '/dosen/notifikasi': 'Notifikasi',
  '/dosen/profil': 'Profil Dosen',
};

export function Topbar({ variant = 'mahasiswa' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (titleMap[path]) return titleMap[path];
    if (path.includes('/appointment/') && path !== '/mahasiswa/appointment/buat') return 'Detail Appointment';
    if (path.includes('/chat/')) return 'Konsultasi Online — Chat';
    return 'KonsulKu';
  };

  const notifPath = variant === 'dosen' ? '/dosen/notifikasi' : '/mahasiswa/notifikasi';

  return (
    <header className="fixed top-0 left-[260px] right-0 h-[64px] bg-white border-b border-gray-200 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-semibold text-gray-900 text-base">{getTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(notifPath)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          id="topbar-notif-btn"
        >
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#4A1D8F] rounded-full"></span>
        </button>
        <div className="w-px h-6 bg-gray-200"></div>
        <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
          <AvatarPlaceholder size={32} />
          <ChevronRight size={14} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
}
