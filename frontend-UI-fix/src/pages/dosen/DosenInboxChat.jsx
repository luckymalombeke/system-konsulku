import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { MessageSquareOff, User } from 'lucide-react';
import { getAppointments } from '../../api';

export default function DosenInboxChat() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const apts = await getAppointments();
        // Extract unique students
        const uniqueMhs = {};
        apts.forEach(a => {
          if (a.mahasiswa) {
            uniqueMhs[a.mahasiswa.user_id] = a.mahasiswa;
          }
        });
        setContacts(Object.values(uniqueMhs));
      } catch (err) {
        console.error("Gagal load contacts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar variant="dosen" />
      <Topbar variant="dosen" />

      <div className="ml-[260px] mt-[64px] flex flex-1 h-[calc(100vh-64px)] bg-[#F8F7FF]">
        {/* Left Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-gray-100 font-bold text-gray-800 text-lg">
            Inbox Mahasiswa
          </div>

          <div className="overflow-y-auto flex-1 flex flex-col">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-400">Memuat data...</div>
            ) : contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <MessageSquareOff size={20} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 italic leading-relaxed">Belum ada mahasiswa yang mengajukan konsultasi kepada Anda.</p>
              </div>
            ) : (
              contacts.map(mhs => (
                <Link 
                  key={mhs.user_id} 
                  to={`/dosen/konsultasi-online/chat/${mhs.user_id}`}
                  state={{ mhs }}
                  className="p-4 border-b border-gray-50 hover:bg-[#F0E9FF] flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-11 h-11 bg-gray-100 group-hover:bg-white text-[#4A1D8F] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-all">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate group-hover:text-[#4A1D8F] transition-colors">{mhs.nama_lengkap}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">NIM: {mhs.nim}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Chat Area Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-10 shadow-inner">
          <div className="max-w-md">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6 transform -rotate-6">
              <MessageSquareOff size={40} className="text-[#4A1D8F]/20" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pilih Mahasiswa</h3>
            <p className="text-sm text-gray-500 leading-relaxed px-4">
              Silakan klik nama mahasiswa di daftar sebelah kiri untuk memulai obrolan (Chat) real-time terkait bimbingan atau proposal mereka.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
