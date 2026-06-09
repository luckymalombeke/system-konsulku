import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';

// Auth
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

// Mahasiswa Pages
const MahasiswaDashboard = lazy(() => import('./pages/mahasiswa/MahasiswaDashboard'));
const KonsultasiPilihDosen = lazy(() => import('./pages/mahasiswa/KonsultasiPilihDosen'));
const ChatPage = lazy(() => import('./pages/mahasiswa/ChatPage'));
const BuatAppointment = lazy(() => import('./pages/mahasiswa/BuatAppointment'));
const RiwayatAppointment = lazy(() => import('./pages/mahasiswa/RiwayatAppointment'));
const DetailAppointment = lazy(() => import('./pages/mahasiswa/DetailAppointment'));
const NotifikasiMahasiswa = lazy(() => import('./pages/mahasiswa/NotifikasiMahasiswa'));
const ProfilMahasiswa = lazy(() => import('./pages/mahasiswa/ProfilMahasiswa'));
const ProposalReview = lazy(() => import('./pages/mahasiswa/ProposalReview'));

// Dosen Pages
const DosenDashboard = lazy(() => import('./pages/dosen/DosenDashboard'));
const DosenInboxChat = lazy(() => import('./pages/dosen/DosenInboxChat'));
const DosenChatPage = lazy(() => import('./pages/dosen/DosenChatPage'));
const DosenKelolAppointment = lazy(() => import('./pages/dosen/DosenKelolAppointment'));
const DosenDetailAppointment = lazy(() => import('./pages/dosen/DosenDetailAppointment'));
const DosenStatistik = lazy(() => import('./pages/dosen/DosenStatistik'));
const NotifikasiDosen = lazy(() => import('./pages/dosen/NotifikasiDosen'));
const ProfilDosen = lazy(() => import('./pages/dosen/ProfilDosen'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A1572] border-t-transparent"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Root → Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Mahasiswa Routes */}
            <Route path="/mahasiswa/dashboard" element={<MahasiswaDashboard />} />
            <Route path="/mahasiswa/konsultasi-online" element={<KonsultasiPilihDosen />} />
            <Route path="/mahasiswa/konsultasi-online/chat/:id" element={<ChatPage />} />
            <Route path="/mahasiswa/appointment/buat" element={<BuatAppointment />} />
            <Route path="/mahasiswa/appointment" element={<RiwayatAppointment />} />
            <Route path="/mahasiswa/appointment/:id" element={<DetailAppointment />} />
            <Route path="/mahasiswa/notifikasi" element={<NotifikasiMahasiswa />} />
            <Route path="/mahasiswa/profil" element={<ProfilMahasiswa />} />
            <Route path="/mahasiswa/proposal-review" element={<ProposalReview />} />

            {/* Dosen Routes */}
            <Route path="/dosen/dashboard" element={<DosenDashboard />} />
            <Route path="/dosen/konsultasi-online" element={<DosenInboxChat />} />
            <Route path="/dosen/konsultasi-online/chat/:id" element={<DosenChatPage />} />
            <Route path="/dosen/appointment" element={<DosenKelolAppointment />} />
            <Route path="/dosen/appointment/:id" element={<DosenDetailAppointment />} />
            <Route path="/dosen/statistik" element={<DosenStatistik />} />
            <Route path="/dosen/notifikasi" element={<NotifikasiDosen />} />
            <Route path="/dosen/profil" element={<ProfilDosen />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </WebSocketProvider>
    </BrowserRouter>
  );
}
