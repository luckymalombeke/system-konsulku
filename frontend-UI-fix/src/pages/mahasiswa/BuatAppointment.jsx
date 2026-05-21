import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { Check, ChevronLeft, ChevronRight, Upload, Calendar, Clock, X, Loader2, FileText, Trash2 } from 'lucide-react';
import { getDosenList, createAppointment } from '../../api';
import { ScheduleSuggestions } from '../../components/ScheduleSuggestions';

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

const steps = ['Pilih Dosen & Topik', 'AI Sugesti Jadwal', 'Detail Konsultasi', 'Konfirmasi'];

export default function BuatAppointment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [selectedDate, setSelectedDate] = useState(21);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('10:00');
  const [success, setSuccess] = useState(false);
  const [dosenList, setDosenList] = useState([]);
  const [isLoadingDosen, setIsLoadingDosen] = useState(true);
  const [showDosenDetail, setShowDosenDetail] = useState(null);

  // Form States
  const [topic, setTopic] = useState("");
  const [problem, setProblem] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validasi ukuran (contoh: maks 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitAppointment = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('dosen_id', selectedDosen);
      formData.append('topik', topic);
      formData.append('deskripsi', problem);
      formData.append('tanggal_request', `2025-04-${selectedDate.toString().padStart(2, '0')}`);
      formData.append('jam_request', `${selectedTime} - ${selectedEndTime}`);
      formData.append('jenis', "Tatap Muka");
      formData.append('status', "Menunggu");
      
      if (selectedFile) {
        formData.append('lampiran', selectedFile);
      }

      await createAppointment(formData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat appointment: ' + err.message);
    } finally {
      setIsSubmitting(false);
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

        {/* Topic Input - Part of Step 1 */}
        {currentStep === 0 && selectedDosen && (
          <div className="card mt-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#4A1D8F]" />
              Topik Konsultasi
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Jelaskan singkat topik konsultasi Anda. AI akan menggunakan ini untuk menyarankan waktu konsultasi terbaik.
            </p>
            <input
              type="text"
              placeholder="Contoh: Revisi metodologi penelitian bab 3"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!selectedDosen || !topic}
                className="flex-1 btn-primary py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjut ke AI Sugesti Jadwal
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Sugesti Jadwal */}
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
                Tentukan Jam untuk {selectedDate} April 2025
              </h3>

              {/* AI Schedule Suggestions */}
              {topic && selectedDosen && (
                <div className="mb-6">
                  <ScheduleSuggestions
                    dosenId={selectedDosen}
                    topic={topic}
                    onSelectSlot={(slot) => {
                      setSelectedTime(slot.time);
                      // Update selectedDate if needed
                      const dateNum = parseInt(slot.date.split('-')[2]);
                      setSelectedDate(dateNum);
                    }}
                  />
                </div>
              )}

              <div className="bg-[#F8F7FF] border border-[#4A1D8F]/20 rounded-xl p-5">
                <p className="text-sm text-gray-600 mb-4">
                  Anda bisa mengajukan jam konsultasi secara bebas. Namun, jam ini masih berupa pengajuan (request) dan akan menunggu persetujuan (Approve/Reject) dari dosen yang bersangkutan.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <label htmlFor="time-start" className="text-sm font-semibold text-gray-700 w-14">
                      Mulai:
                    </label>
                    <input 
                      id="time-start"
                      type="time" 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A1D8F] font-medium text-gray-800"
                      required
                    />
                  </div>
                  <span className="hidden sm:block text-gray-400 font-bold">-</span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="time-end" className="text-sm font-semibold text-gray-700 w-14 sm:w-auto">
                      Selesai:
                    </label>
                    <input 
                      id="time-end"
                      type="time" 
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A1D8F] font-medium text-gray-800"
                      required
                    />
                  </div>
                  <span className="text-sm text-gray-500 font-medium ml-2">WITA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Detail Konsultasi */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-5">Detail Konsultasi</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi / Pertanyaan <span className="text-red-500">*</span></label>
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
                  
                  {selectedFile ? (
                    <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-600 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                        title="Hapus file"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#4A1D8F] hover:bg-[#F0E9FF]/30 transition-colors">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                      <Upload size={28} className="text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 font-medium text-center">Klik untuk mengambil file dari perangkat Anda</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG — maks. 10MB</p>
                    </label>
                  )}
                </div>
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
                  { label: 'Dosen', value: dosenList.find(d => d.id === selectedDosen)?.nama_lengkap || 'Belum dipilih' },
                  { label: 'Prodi Dosen', value: dosenList.find(d => d.id === selectedDosen)?.prodi || '-' },
                  { label: 'Tanggal', value: `${selectedDate} April 2025` },
                  { label: 'Jam', value: `${selectedTime} - ${selectedEndTime} WITA` },
                  { label: 'Topik', value: topic || 'Belum ada topik' },
                  { label: 'Lampiran', value: selectedFile ? selectedFile.name : 'Tidak ada lampiran' },
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
            onClick={handleSubmitAppointment}
            disabled={isSubmitting}
            className={`text-white rounded-lg py-2 px-5 font-semibold transition-colors flex items-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#059669] hover:bg-green-700'}`}
            id="btn-kirim-request"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isSubmitting ? 'Mengirim...' : 'Kirim Request'}
          </button>
        )}
      </div>
    </Layout>
  );
}
