import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Calendar, Bell, User,
  BarChart2, LogOut, BookOpen, GraduationCap
} from 'lucide-react';
import { AvatarPlaceholder } from './AvatarPlaceholder';

const mahasiswaNav = [
  { to: '/mahasiswa/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mahasiswa/konsultasi-online', icon: MessageSquare, label: 'Konsultasi Online' },
  { to: '/mahasiswa/appointment', icon: Calendar, label: 'Appointment' },
  { to: '/mahasiswa/notifikasi', icon: Bell, label: 'Notifikasi' },
  { to: '/mahasiswa/proposal-review', icon: BookOpen, label: 'Proposal Review' },
  { to: '/mahasiswa/profil', icon: User, label: 'Profil' },
];

const dosenNav = [
  { to: '/dosen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dosen/konsultasi-online', icon: MessageSquare, label: 'Konsultasi Online' },
  { to: '/dosen/appointment', icon: Calendar, label: 'Appointment' },
  { to: '/dosen/statistik', icon: BarChart2, label: 'Statistik' },
  { to: '/dosen/notifikasi', icon: Bell, label: 'Notifikasi' },
  { to: '/dosen/profil', icon: User, label: 'Profil' },
];

export function Sidebar({ variant = 'mahasiswa' }) {
  const navigate = useNavigate();
  const navItems = variant === 'dosen' ? dosenNav : mahasiswaNav;
  
  // Ambil data user asli dari localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const user = {
    name: storedUser.nama_lengkap || (variant === 'dosen' ? 'Dosen' : 'Mahasiswa'),
    role: variant === 'dosen' ? 'Dosen' : 'Mahasiswa',
    idNumber: variant === 'dosen' ? `NIP: ${storedUser.no_induk || '-'}` : `NIM: ${storedUser.no_induk || '-'}`
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-[260px] bg-[#311160] border-r border-white/5 flex flex-col z-50 shadow-2xl">
      {/* Background glow effect */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#FFD700]/10 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="px-6 py-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10 border border-white/20">
            <GraduationCap className="w-6 h-6 text-[#FFD700]" />
          </div>
          <div>
            <div className="text-white font-extrabold text-lg tracking-tight leading-tight drop-shadow-sm">KonsulKu</div>
            <div className="text-[#FFD700]/80 font-medium text-xs tracking-wider uppercase mt-0.5">Portal Akademik</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto z-10">
        <div className="mb-3 px-3 text-white/40 text-[10px] font-bold uppercase tracking-widest">Menu Utama</div>
        <div className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive 
                    ? 'bg-white/10 text-[#FFD700] shadow-inner border border-white/5 backdrop-blur-md' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 mx-3 mb-4 mt-auto rounded-2xl bg-black/20 border border-white/10 backdrop-blur-sm z-10 hover:bg-black/30 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="ring-2 ring-[#FFD700]/50 rounded-full">
            <AvatarPlaceholder size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{user.name}</div>
            <div className="text-white/50 text-[11px] truncate mt-0.5 font-medium">{user.idNumber}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${variant === 'dosen' ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-purple-400/20 text-purple-300'}`}>
            {user.role}
          </span>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-white/40 hover:text-red-400 text-xs transition-colors font-medium"
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
