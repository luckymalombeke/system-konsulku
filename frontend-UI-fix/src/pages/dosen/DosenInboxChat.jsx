import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { MessageSquareOff, Search } from 'lucide-react';

export default function DosenInboxChat() {
  const [activeTab, setActiveTab] = useState('Semua');
  const konversasiTabs = ['Semua', 'Belum Dibaca', 'Arsip'];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar variant="dosen" />
      <Topbar variant="dosen" />

      <div className="ml-[260px] mt-[64px] flex flex-1 h-[calc(100vh-64px)] bg-[#F8F7FF]">
        {/* Left Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100">
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari mahasiswa..." className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A1D8F]" />
            </div>
            <div className="flex gap-1">
              {konversasiTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-[#F0E9FF] text-[#4A1D8F]' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <MessageSquareOff size={20} className="text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 italic">Belum ada percakapan</p>
          </div>
        </div>

        {/* Right Panel: Chat Area Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-10">
          <div className="max-w-md">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
              <MessageSquareOff size={32} className="text-[#4A1D8F]/20" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konsultasi Online</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Fitur chat real-time sedang dalam tahap pengembangan. Saat ini Anda dapat mengelola janji temu melalui menu <span className="font-bold text-[#4A1D8F]">Kelola Appointment</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
