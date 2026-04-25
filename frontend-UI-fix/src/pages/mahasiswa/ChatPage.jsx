import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { Send, User, MessageSquare } from 'lucide-react';
import { getMessages, getDosenList, login } from '../../api'; // Pastikan API ini ada

export default function ChatPage() {
  const { id: targetUserID } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef();

  // Load pesan awal dari database
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const msgData = await getMessages(targetUserID);
        setMessages(msgData || []);
        
        // Cari info dosen (target)
        const dosenList = await getDosenList();
        const found = dosenList.find(d => d.user_id === parseInt(targetUserID));
        setTargetUser(found);
      } catch (err) {
        console.error("Gagal load chat:", err);
      }
    };
    fetchChatData();
  }, [targetUserID]);

  // Listener untuk pesan Real-Time dari WebSocket
  useEffect(() => {
    const handleWsMessage = (e) => {
      const data = e.detail;
      if (data.type === 'NEW_CHAT' && (data.payload.pengirim_id === parseInt(targetUserID) || data.payload.target_user_id === parseInt(targetUserID))) {
        setMessages((prev) => [...prev, data.payload]);
      }
    };

    window.addEventListener('wsMessage', handleWsMessage);
    return () => window.removeEventListener('wsMessage', handleWsMessage);
  }, [targetUserID]);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      // Panggil API Send Message
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8081/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_user_id: parseInt(targetUserID), teks: inputText })
      });

      if (res.ok) {
        const user = JSON.parse(localStorage.getItem('user'));
        // Tambahkan ke UI lokal dulu biar instan
        const newMsg = {
          pengirim_id: user.id,
          teks: inputText,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText('');
      }
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar variant="mahasiswa" />
      <div className="flex-1 flex flex-col ml-[260px]">
        <Topbar variant="mahasiswa" />
        
        <main className="flex-1 mt-[64px] flex flex-col overflow-hidden">
          {/* Header Chat */}
          <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4A1D8F]/10 rounded-full flex items-center justify-center text-[#4A1D8F]">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{targetUser?.nama_lengkap || 'Dosen...'}</h2>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                </p>
              </div>
            </div>
            {targetUser && (
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="text-xs font-bold text-[#4A1D8F] bg-[#F0E9FF] px-3 py-1.5 rounded-lg hover:bg-[#E2D5FF] transition-colors"
              >
                {showProfile ? 'Tutup Profil' : 'Lihat Profil'}
              </button>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Area Pesan */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare size={48} className="mb-2 opacity-20" />
                  <p className="text-sm italic">Belum ada percakapan. Mulai diskusi sekarang.</p>
                </div>
              )}
              
              {messages.map((msg, idx) => {
                const isMe = msg.pengirim_id === currentUser?.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${
                      isMe 
                      ? 'bg-[#4A1D8F] text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {msg.teks}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Sidebar Profil Target (Conditional) */}
            {showProfile && targetUser && (
              <div className="w-[300px] border-l bg-white p-6 overflow-y-auto animate-fade-in hidden lg:block">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User size={40} className="text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight">{targetUser.nama_lengkap}</h3>
                  <p className="text-xs text-gray-400 mt-1">NIP: {targetUser.nip}</p>
                  <p className="text-xs text-[#4A1D8F] font-bold mt-2 uppercase tracking-wider">{targetUser.prodi}</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Biografi</h4>
                    <p className="text-xs text-gray-600 italic leading-relaxed">"{targetUser.bio || 'Belum ada biografi.'}"</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pengalaman</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{targetUser.pengalaman || 'Belum ada data pengalaman.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik pesan konsultasi Anda..."
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#4A1D8F] transition-all"
              />
              <button
                type="submit"
                className="bg-[#4A1D8F] text-white p-3 rounded-xl hover:bg-[#361568] transition-colors shadow-md"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
