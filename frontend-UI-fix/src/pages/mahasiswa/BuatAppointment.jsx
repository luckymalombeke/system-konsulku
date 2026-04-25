import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { Check, ChevronLeft, ChevronRight, Upload, Calendar, Clock, X, Sparkles, Loader2 } from 'lucide-react';
import { getDosenList, getAIAdvice } from '../../api';

const dosenOptions = [
  { id: 1, name: 'Stenly R. Pungus, S.Kom., MT., M.M., PhD', prodi: 'Sistem Informasi', skills: ['Machine Learning', 'Data Science'], available: true },
  { id: 2, name: 'Semmy Taju, S.Kom., M.S., PhD', prodi: 'Teknik Informatika', skills: ['Computer Vision', 'IoT'], available: true },
  { id: 3, name: 'Jimmy Moedjahedy, MM, MKom', prodi: 'Sistem Informasi', skills: ['Rekayasa Perangkat Lunak', 'UX'], available: false },
  { id: 4, name: 'Ir. Marchel T. Tombeng, S.Kom., M.S., IPM', prodi: 'Manajemen Informatika', skills: ['Database', 'Cloud'], available: true },
  { id: 5, name: 'Prof. Andrew T. Liem, M.T., Ph.D', prodi: 'Teknik Informatika', skills: ['Algoritma', 'AI'], available: true },
  { id: 6, name: 'Debby E. Sondakh, S.Kom., M.T., Ph.D', prodi: 'Sistem Informasi', skills: ['Jaringan', 'Keamanan'], available: true },
];

const calendarDays = [
  [null, null, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, null, null, null],
];

const timeSlots = [
  { time: '08:00', available: true },
  { time: '09:00', available: true },
  { time: '10:00', available: false },
  { time: '11:00', available: true },
  { time: '13:00', available: true },
  { time: '14:00', available: false },
  { time: '15:00', available: true },
  { time: '16:00', available: true },
  { time: '17:00', available: false },
];

const steps = ['Pilih Dosen', 'Pilih Jadwal', 'Detail Konsultasi', 'Konfirmasi'];

export default function BuatAppointment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [selectedDate, setSelectedDate] = useState(21);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [success, setSuccess] = useState(false);
  const [dosenList, setDosenList] = useState([]);
  const [isLoadingDosen, setIsLoadingDosen] = useState(true);
  const [showDosenDetail, setShowDosenDetail] = useState(null);

  // AI States
  const [topic, setTopic] = useState("Pembahasan metodologi dan analisis data skripsi");
  const [problem, setProblem] = useState("Saya memiliki beberapa pertanyaan terkait metode pengumpulan data yang tepat untuk penelitian saya. Penelitian saya menggunakan pendekatan kuantitatif dengan responden mahasiswa aktif. Saya ingin mendiskusikan apakah metode survei atau eksperimen yang lebih cocok.");
  const [aiAdvice, setAiAdvice] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const handleGetAIAdvice = async () => {
    if (!topic || !problem) return;
    setIsLoadingAI(true);
    try {
      const res = await getAIAdvice(topic, problem);
      setAiAdvice(res.advice);
    } catch (err) {
      console.error(err);
      alert("Gagal mendapatkan saran AI. Pastikan API Key sudah terpasang.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    const fetchDosen = async () => {
      try {
        const data = await getDosenList();
        setDosenList(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingDosen(false);
      }
    };
    fetchDosen();
  }, []);

  if (success) {
    return (
      <Layout variant="mahasiswa">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Berhasil Dikirim!</h2>
          <p className="text-gray-500 text-center max-w-md mb-8">
            Permintaan appointment Anda telah berhasil dikirim kepada dosen. Dosen akan merespons dalam 1×24 jam kerja.
          </p>
          <div className="flex gap-3">
            <Link to="/mahasiswa/appointment" className="btn-primary">Lihat Status Appointment</Link>
            <Link to="/mahasiswa/dashboard" className="btn-outlined">Kembali ke Dashboard</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="mahasiswa">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Buat Jadwal Konsultasi Tatap Muka</h1>
        <p className="text-sm text-gray-500">Lengkapi langkah-langkah berikut untuk mengajukan request appointment.</p>
      </div>

      {/* Stepper */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < currentStep ? 'bg-[#4A1D8F] text-white' :
                  i === currentStep ? 'bg-[#4A1D8F] text-white ring-4 ring-[#4A1D8F]/20' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentStep ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  i === currentStep ? 'text-[#4A1D8F]' : i < currentStep ? 'text-gray-600' : 'text-gray-400'
                }`}>{step}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-[#4A1D8F]' : 'bg-gray-200'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {/* Step 1: Pilih Dosen */}
        {currentStep === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Pilih Dosen Pembimbing</h2>
              <span className="text-xs text-gray-400 font-medium">{dosenList.length} Dosen Tersedia</span>
            </div>
            {isLoadingDosen ? (
              <div className="text-center py-10 text-gray-400 italic">Memuat daftar dosen...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dosenList.map(dosen => (
                  <div 
                    key={dosen.id}
                    className={`card group transition-all relative cursor-pointer ${selectedDosen === dosen.id ? 'border-2 border-[#4A1D8F] bg-[#F0E9FF]' : 'hover:border-gray-300'}`}
                    onClick={() => setSelectedDosen(dosen.id)}
                  >
                    {selectedDosen === dosen.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#4A1D8F] rounded-full flex items-center justify-center z-10">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <AvatarPlaceholder size={52} />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500"></span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 leading-tight">{dosen.nama_lengkap}</div>
                        <div className="text-[10px] text-[#4A1D8F] font-bold uppercase tracking-wide mt-0.5">{dosen.prodi}</div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8 italic">
                      "{dosen.bio || 'Belum ada biografi.'}"
                    </p>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDosenDetail(dosen);
                      }}
                      className="w-full py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Lihat Profil & Pengalaman
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dosen Detail Modal */}
            {showDosenDetail && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                  <div className="relative h-24 bg-gradient-to-r from-[#4A1D8F] to-[#3A1572]">
                    <button 
                      onClick={() => setShowDosenDetail(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="px-8 pb-8">
                    <div className="relative -mt-10 mb-4 inline-block">
                      <div className="p-1 bg-white rounded-full">
                        <AvatarPlaceholder size={80} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{showDosenDetail.nama_lengkap}</h3>
                    <p className="text-sm text-[#4A1D8F] font-bold uppercase tracking-widest mb-4">{showDosenDetail.prodi}</p>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Biografi</h4>
                        <p className="text-sm text-gray-600 leading-relaxed italic">"{showDosenDetail.bio || 'Belum ada biografi.'}"</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pengalaman & Keahlian</h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{showDosenDetail.pengalaman || 'Belum ada data pengalaman.'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSelectedDosen(showDosenDetail.id);
                        setShowDosenDetail(null);
                      }}
                      className="w-full mt-8 btn-primary py-3 rounded-xl font-bold"
                    >
                      Pilih Dosen Ini
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pilih Jadwal */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">April 2025</h3>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} className="text-gray-600" /></button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} className="text-gray-600" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.flat().map((day, i) => (
                  <button
                    key={i}
                    onClick={() => day && setSelectedDate(day)}
                    className={`h-9 w-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors ${
                      !day ? '' :
                      day === selectedDate ? 'bg-[#4A1D8F] text-white font-semibold' :
                      day <= 19 ? 'text-gray-300 cursor-not-allowed' :
                      'text-gray-700 hover:bg-[#F0E9FF] hover:text-[#4A1D8F]'
                    }`}
                    disabled={!day || day <= 19}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-[#4A1D8F]" />
                Pilih Jam untuk {selectedDate} April 2025
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    className={`py-2.5 text-center text-sm rounded-lg transition-colors ${
                      !slot.available ? 'bg-gray-100 text-gray-300 line-through cursor-not-allowed' :
                      selectedTime === slot.time ? 'bg-[#4A1D8F] text-white font-medium' :
                      'border border-gray-200 text-gray-700 hover:border-[#4A1D8F] hover:text-[#4A1D8F]'
                    }`}
                    disabled={!slot.available}
                    id={`time-${slot.time}`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Detail Konsultasi */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <h2 className="font-semibold text-gray-800 mb-5">Detail Konsultasi</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Topik Konsultasi <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: Revisi metodologi penelitian bab 3"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Deskripsi / Pertanyaan <span className="text-red-500">*</span></label>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleGetAIAdvice();
                      }}
                      disabled={isLoadingAI}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#F0E9FF] border border-[#4A1D8F]/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#4A1D8F] hover:bg-[#4A1D8F] hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      {isLoadingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Tanya Asisten AI ✨
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Jelaskan secara detail pertanyaan atau topik yang ingin Anda diskusikan..."
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lampiran (Opsional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#4A1D8F] hover:bg-[#F0E9FF]/30 transition-colors">
                    <Upload size={28} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Klik untuk upload atau drag &amp; drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG — maks. 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`card overflow-hidden transition-all duration-500 ${aiAdvice ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-[#F0E9FF] rounded-lg">
                    <Sparkles size={16} className="text-[#4A1D8F]" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Saran Persiapan AI</h3>
                </div>
                
                {isLoadingAI ? (
                  <div className="py-10 flex flex-col items-center justify-center text-gray-400 italic">
                    <Loader2 size={24} className="animate-spin mb-2 text-[#4A1D8F]" />
                    <p className="text-xs text-center px-4">AI sedang menganalisa masalah Anda...</p>
                  </div>
                ) : aiAdvice ? (
                  <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-[#F8F5FF] p-4 rounded-xl border border-[#EBE0FF]">
                    {aiAdvice}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs px-4">
                    Belum ada saran. Klik <b>"Tanya Asisten AI"</b> untuk mendapatkan panduan persiapan konsultasi.
                  </div>
                )}
              </div>

              <div className="bg-[#4A1D8F] rounded-2xl p-5 text-white shadow-lg shadow-[#4A1D8F]/20">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                   💡 Tips Sukses
                </h4>
                <p className="text-[10px] leading-relaxed opacity-90">
                  Konsultasi yang efektif dimulai dari persiapan yang matang. Gunakan saran AI untuk memastikan poin-poin penting Anda tersampaikan ke Dosen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Konfirmasi */}
        {currentStep === 3 && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-[#F0E9FF] rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[#4A1D8F]" />
                Ringkasan Appointment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Dosen', value: 'Stenly R. Pungus, S.Kom., MT., M.M., PhD' },
                  { label: 'Prodi Dosen', value: 'Sistem Informasi' },
                  { label: 'Tanggal', value: '21 April 2025 (Senin)' },
                  { label: 'Jam', value: `${selectedTime} WITA` },
                  { label: 'Topik', value: 'Pembahasan metodologi dan analisis data skripsi' },
                  { label: 'Lampiran', value: 'Draft_Bab3_Andi.pdf' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2 text-sm text-yellow-800">
              <span className="text-yellow-600 mt-0.5">⚠️</span>
              <div>
                Pastikan semua informasi sudah benar sebelum mengirim request. Dosen akan mengonfirmasi jadwal dalam 1×24 jam kerja.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => currentStep > 0 && setCurrentStep(s => s - 1)}
          className={`btn-outlined flex items-center gap-2 ${currentStep === 0 ? 'invisible' : ''}`}
          id="btn-kembali-step"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>

        {currentStep < 3 ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            className="btn-primary flex items-center gap-2"
            id="btn-lanjut-step"
          >
            Lanjut
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => setSuccess(true)}
            className="bg-[#059669] text-white rounded-lg py-2 px-5 font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            id="btn-kirim-request"
          >
            <Check size={16} />
            Kirim Request
          </button>
        )}
      </div>
    </Layout>
  );
}
