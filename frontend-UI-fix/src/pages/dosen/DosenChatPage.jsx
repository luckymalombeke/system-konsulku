import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { Send, User, MessageSquare, ChevronLeft } from 'lucide-react';
import { getMessages, API_BASE_URL } from '../../api';

export default function DosenChatPage() {
  const { id: targetUserID } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Ambil state mhs dari navigasi DosenInboxChat jika ada
  const mhsData = location.state?.mhs;
  const targetUserName = mhsData?.nama_lengkap || `Mahasiswa (ID: ${targetUserID})`;
  const targetNim = mhsData?.nim || '';

  const scrollRef = useRef();

  // Load pesan & info mahasiswa
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const msgData = await getMessages(targetUserID);
        console.log("FETCHED MSG DATA:", msgData);
        setMessages(msgData || []);
      } catch (err) {
        console.error("Gagal load chat:", err);
      }
    };
    fetchChatData();
  }, [targetUserID]);

  // WebSocket Listener
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_user_id: parseInt(targetUserID), teks: inputText })
      });

      if (res.ok) {
        const user = JSON.parse(localStorage.getItem('user'));
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
      <Sidebar variant="dosen" />
      <div className="flex-1 flex flex-col ml-[260px]">
        <Topbar variant="dosen" />
        
        <main className="flex-1 mt-[64px] flex flex-col overflow-hidden">
          {/* Header Chat */}
          <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4A1D8F]/10 rounded-full flex items-center justify-center text-[#4A1D8F]">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{targetUserName}</h2>
                {targetNim && <p className="text-xs text-gray-500 mb-0.5">NIM: {targetNim}</p>}
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare size={48} className="mb-2 opacity-20" />
                <p className="text-sm italic">Belum ada diskusi dengan mahasiswa ini.</p>
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

          {/* Chat Input */}
          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Berikan arahan atau jawaban untuk mahasiswa..."
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
