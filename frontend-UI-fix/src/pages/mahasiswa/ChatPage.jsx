import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { Send, User, MessageSquare, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { getMessages, getDosenList, login, editMessage, deleteMessage, API_BASE_URL } from '../../api'; // Pastikan API ini ada

export default function ChatPage() {
  const { id: targetUserID } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
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
      if (data.type === 'NEW_CHAT') {
        setMessages((prev) => [...prev, data.payload]);
      } else if (data.type === 'MESSAGE_EDITED' || data.type === 'MESSAGE_DELETED') {
        setMessages((prev) => prev.map(m => m.id === data.payload.id ? data.payload : m));
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

    if (editingMessageId) {
      try {
        await editMessage(editingMessageId, inputText);
        setMessages((prev) => prev.map(m => m.id === editingMessageId ? { ...m, teks: inputText, diedit: true } : m));
        setEditingMessageId(null);
        setInputText('');
      } catch (err) {
        console.error("Gagal edit pesan:", err);
      }
      return;
    }

    try {
      // Panggil API Send Message
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
        const responseData = await res.json();
        // Menggunakan data pesan asli dari server agar ID-nya terbaca
        setMessages((prev) => [...prev, responseData.data]);
        setInputText('');
      }
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus pesan ini?")) return;
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.map(m => m.id === id ? { ...m, teks: "Pesan ini telah dihapus", dihapus: true } : m));
      setActiveMenuId(null);
    } catch (err) {
      console.error("Gagal hapus pesan:", err);
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
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>

                    {isMe && !msg.dihapus && msg.id && (
                      <div className={`flex items-center mr-2 transition-opacity relative ${activeMenuId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)} className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm">
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === msg.id && (
                          <div className="absolute right-0 bottom-full mb-1 bg-white border shadow-lg rounded-xl py-1 z-20 w-32 overflow-hidden">
                            <button
                              onClick={() => { setEditingMessageId(msg.id); setInputText(msg.teks); setActiveMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 size={14} /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${isMe
                        ? 'bg-[#4A1D8F] text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      } ${msg.dihapus ? 'italic opacity-60 bg-gray-100 text-gray-500 border-none' : ''}`}>
                      {msg.teks}
                      {msg.diedit && !msg.dihapus && <span className="text-[10px] opacity-70 ml-2 font-medium">(diedit)</span>}
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
          <div className="p-4 bg-white border-t relative">
            {editingMessageId && (
              <div className="absolute bottom-full left-0 right-0 bg-gray-50 px-6 py-2 border-t flex justify-between items-center shadow-[0_-5px_10px_rgb(0,0,0,0.02)]">
                <div className="flex items-center gap-2 text-xs text-[#4A1D8F] font-semibold">
                  <Edit2 size={14} />
                  <span>Sedang mengedit pesan...</span>
                </div>
                <button onClick={() => { setEditingMessageId(null); setInputText(''); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={editingMessageId ? "Ketik pesan baru..." : "Ketik pesan konsultasi Anda..."}
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
