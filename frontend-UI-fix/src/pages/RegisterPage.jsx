import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, GraduationCap, ChevronRight, User as UserIcon, Mail } from 'lucide-react';
import { register } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mahasiswa');
  const [showPassword, setShowPassword] = useState(false);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDaftar = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    
    if (!username || !email || !password) {
      setError('Mohon isi semua field (Username/NIM/NIP, Email, Password)');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        username: username,
        email: email,
        password: password,
        role: activeTab
      };

      const res = await register(data);
      setSuccess('Berhasil mendaftar! Mengalihkan ke halaman Login...');
      
      // Tunggu 2 detik lalu pindah ke halaman login
      setTimeout(() => {
        navigate('/login', { state: { role: activeTab } });
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url('/campus-bg.webp')` }}
      />
      <div className="absolute inset-0 z-0 bg-[#3A1572]/60 mix-blend-multiply" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1b0a36] via-[#3A1572]/40 to-transparent" />

      {/* Floating Elements (Subtle Animation) */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#FFD700]/20 rounded-full blur-3xl animate-pulse z-0" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#6B2FBF]/30 rounded-full blur-3xl animate-pulse z-0" style={{ animationDelay: '2s' }} />

      {/* Glassmorphic Register Card */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col lg:flex-row glass-panel overflow-hidden animate-slide-up shadow-2xl rounded-2xl">

        {/* Left Informational Side */}
        <div className="lg:w-5/12 p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-[#3A1572]/70 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg border border-white/20 p-1.5 overflow-hidden">
                <GraduationCap className="w-7 h-7 text-[#FFD700] drop-shadow-md" />
              </div>
              <span className="text-white font-bold text-2xl tracking-tight drop-shadow-lg">KonsulKu</span>
            </div>

            <span className="inline-block bg-[#FFD700] text-[#3A1572] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 shadow-md">
              Portal Akademik
            </span>
            <h1 className="text-4xl font-extrabold text-white leading-[1.1] mb-5 drop-shadow-xl">
              Mulai Kolaborasi<br />Akademik Anda
            </h1>
            <p className="text-white/90 text-sm leading-relaxed mb-8 drop-shadow-md font-medium">
              Bergabunglah dengan Portal Akademik Generasi Baru. Buat akun sekarang untuk mengakses jadwal, diskusi real-time, dan memantau progres bimbingan.
            </p>
          </div>

          <div className="text-white/40 text-xs font-medium">
            © 2025 KonsulKu Platform.<br />All rights reserved.
          </div>
        </div>

        {/* Right Form Side */}
        <div className="lg:w-7/12 bg-white/90 backdrop-blur-xl p-10 lg:p-12">
          <div className="max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun Baru ✨</h2>
            <p className="text-gray-500 text-sm mb-8">Lengkapi data Anda untuk mendaftar ke portal.</p>

            {/* Premium Tab Toggle */}
            <div className="flex bg-gray-100/80 p-1.5 rounded-xl mb-6 border border-gray-200/50 shadow-inner">
              {['mahasiswa', 'dosen'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2 ${activeTab === tab
                    ? 'bg-white text-[#3A1572] shadow-sm ring-1 ring-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab === 'mahasiswa' ? <GraduationCap size={16} /> : <BookOpen size={16} />}
                  {tab === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  {activeTab === 'mahasiswa' ? 'Nomor Induk Mahasiswa (NIM)' : 'Nomor Induk Pegawai (NIP)'}
                </label>
                <div className="relative group flex items-center">
                  <div className="absolute left-4 text-gray-400">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder={activeTab === 'mahasiswa' ? 'Contoh: 20210001' : 'Contoh: 19850312001'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A1572]/50 focus:border-[#3A1572] transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Alamat Email Aktif
                </label>
                <div className="relative group flex items-center">
                  <div className="absolute left-4 text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Contoh: s20210001@student.university.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A1572]/50 focus:border-[#3A1572] transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Buat kata sandi baru (min 6 karakter)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A1572]/50 focus:border-[#3A1572] transition-all duration-300 group-hover:border-gray-300 font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    className="absolute right-2 text-gray-400 hover:text-[#3A1572] transition-colors p-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
                    {success}
                  </div>
                )}
                <button
                  onClick={handleDaftar}
                  disabled={isLoading || success}
                  className="w-full bg-[#3A1572] text-white rounded-xl py-3.5 font-bold shadow-lg shadow-[#3A1572]/30 hover:shadow-[#3A1572]/50 hover:bg-[#2b0e55] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
                  {!isLoading && <ChevronRight size={18} />}
                </button>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="text-[#3A1572] font-bold hover:text-[#FFD700] transition-colors">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
