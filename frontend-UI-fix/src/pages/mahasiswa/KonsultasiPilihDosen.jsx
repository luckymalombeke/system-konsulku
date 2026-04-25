import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { ChevronRight, User } from 'lucide-react';
import { getDosenList } from '../../api';

export default function KonsultasiPilihDosen() {
  const [dosenList, setDosenList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDosen = async () => {
      setIsLoading(true);
      try {
        const data = await getDosenList();
        setDosenList(data || []);
      } catch (err) {
        console.error("Gagal mengambil daftar dosen:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDosen();
  }, []);

  return (
    <Layout variant="mahasiswa">
      <div className="animate-fade-in">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-[#3A1572] mb-3">Direktori Dosen Fakultas</h1>
          <p className="text-sm text-gray-500 font-medium">Temui dan komunikasikan kebutuhan akademik Anda secara langsung kepada Dosen Fakultas Ilmu Komputer yang tersedia.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400 italic">Memuat daftar dosen...</div>
        ) : dosenList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={30} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Dosen Terdaftar</h3>
            <p className="text-sm text-gray-500 px-10">Dosen harus mendaftarkan akun mereka terlebih dahulu agar muncul di direktori ini secara otomatis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto animate-slide-up-delayed">
            {dosenList.map((dosen) => (
              <div key={dosen.id} className="flex flex-col items-center group relative">
                <div className="block relative w-full aspect-[3/4] max-w-[240px] mb-5">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-[0_15px_40px_rgb(0,0,0,0.15)] overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_20px_50px_rgb(58,21,114,0.3)] flex items-center justify-center">
                    {/* Placeholder for real images in future */}
                    <div className="text-gray-400 flex flex-col items-center gap-2">
                      <User size={60} strokeWidth={1} />
                      <span className="text-[10px] uppercase tracking-widest font-bold">No Photo</span>
                    </div>
                  </div>

                  <Link 
                    to="/mahasiswa/appointment" // Redirect to appointment list to create one
                    className="absolute inset-0 bg-[#3A1572]/0 group-hover:bg-[#3A1572]/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-3xl flex flex-col items-center justify-center"
                  >
                    <div className="bg-[#FFD700] text-[#3A1572] rounded-full p-3 mb-2 transform -translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <ChevronRight size={24} />
                    </div>
                    <span className="text-white font-bold text-sm tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Buat Appointment</span>
                  </Link>

                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 z-10">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase text-gray-700">Tersedia</span>
                  </div>
                </div>

                <div className="text-center px-2">
                  <h3 className="font-extrabold text-gray-900 text-[15px] mb-1 tracking-tight">{dosen.prodi || 'Dosen FILKOM'}</h3>
                  <p className="text-[13px] text-gray-500 font-medium leading-snug">{dosen.nama_lengkap}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">NIP: {dosen.nip}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
