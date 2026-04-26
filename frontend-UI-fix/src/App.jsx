import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Mahasiswa Pages
import MahasiswaDashboard from './pages/mahasiswa/MahasiswaDashboard';
import KonsultasiPilihDosen from './pages/mahasiswa/KonsultasiPilihDosen';
import ChatPage from './pages/mahasiswa/ChatPage';
import BuatAppointment from './pages/mahasiswa/BuatAppointment';
import RiwayatAppointment from './pages/mahasiswa/RiwayatAppointment';
import DetailAppointment from './pages/mahasiswa/DetailAppointment';
import NotifikasiMahasiswa from './pages/mahasiswa/NotifikasiMahasiswa';
import ProfilMahasiswa from './pages/mahasiswa/ProfilMahasiswa';
import ProposalReview from './pages/mahasiswa/ProposalReview';

// Dosen Pages
import DosenDashboard from './pages/dosen/DosenDashboard';
import DosenInboxChat from './pages/dosen/DosenInboxChat';
import DosenChatPage from './pages/dosen/DosenChatPage';
import DosenKelolAppointment from './pages/dosen/DosenKelolAppointment';
import DosenDetailAppointment from './pages/dosen/DosenDetailAppointment';
import DosenStatistik from './pages/dosen/DosenStatistik';
import NotifikasiDosen from './pages/dosen/NotifikasiDosen';
import ProfilDosen from './pages/dosen/ProfilDosen';

import { WebSocketProvider } from './context/WebSocketContext';

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
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
      </WebSocketProvider>
    </BrowserRouter>
  );
}
