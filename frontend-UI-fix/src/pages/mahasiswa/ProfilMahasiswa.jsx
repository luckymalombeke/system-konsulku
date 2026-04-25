import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { Edit2, Save, X } from 'lucide-react';
import { getProfile, updateProfile, logout } from '../../api';

export default function ProfilMahasiswa() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nim: '',
    semester: 1,
    prodi: '',
    bio: '',
    pengalaman: ''
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setFormData({
        nama_lengkap: data.nama_lengkap || '',
        nim: data.nim || '',
        semester: data.semester || 1,
        prodi: data.prodi || '',
        bio: data.bio || '',
        pengalaman: data.pengalaman || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      fetchProfile();
      alert("Profil berhasil diperbarui!");
    } catch (err) {
      alert("Gagal update profil: " + err.message);
    }
  };

  if (isLoading) return <Layout variant="mahasiswa"><div className="p-20 text-center text-gray-400">Memuat profil...</div></Layout>;

  return (
    <Layout variant="mahasiswa">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#4A1D8F] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#3A1572] transition-colors"
          >
            <Edit2 size={16} /> Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <X size={16} /> Batal
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-500 transition-colors"
            >
              <Save size={16} /> Simpan
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Left Card */}
        <div className="card text-center h-fit">
          <div className="relative w-[100px] mx-auto mb-4">
            <AvatarPlaceholder size={100} />
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center"
                value={formData.nama_lengkap}
                onChange={e => setFormData({...formData, nama_lengkap: e.target.value})}
                placeholder="Nama Lengkap"
              />
              <input 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center"
                value={formData.nim}
                onChange={e => setFormData({...formData, nim: e.target.value})}
                placeholder="NIM"
              />
            </div>
          ) : (
            <>
              <div className="text-xl font-bold text-gray-900">{profile?.nama_lengkap || 'Belum diatur'}</div>
              <div className="text-sm text-gray-400 mt-1">NIM: {profile?.nim || '-'}</div>
            </>
          )}

          <div className="text-sm text-[#4A1D8F] font-medium mt-2">{profile?.prodi || 'Program Studi'}</div>
          
          <div className="mt-4 pt-4 border-t border-gray-50 text-left">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-2 tracking-widest text-center">Pengenalan Diri</div>
            {isEditing ? (
              <textarea 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-32 resize-none"
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Tuliskan perkenalan diri Anda..."
              />
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed text-center italic">
                {profile?.bio || '"Belum ada perkenalan diri."'}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Informasi Akademik</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Semester</label>
                {isEditing ? (
                  <input 
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.semester}
                    onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})}
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{profile?.semester || '-'}</div>
                )}
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Program Studi</label>
                {isEditing ? (
                  <input 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.prodi}
                    onChange={e => setFormData({...formData, prodi: e.target.value})}
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{profile?.prodi || '-'}</div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Pengalaman & Keahlian</h3>
            {isEditing ? (
              <textarea 
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm h-32 resize-none focus:ring-2 focus:ring-[#4A1D8F] outline-none"
                value={formData.pengalaman}
                onChange={e => setFormData({...formData, pengalaman: e.target.value})}
                placeholder="Tuliskan pengalaman organisasi, magang, atau keahlian Anda..."
              />
            ) : (
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {profile?.pengalaman || 'Belum ada data pengalaman.'}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Keamanan & Akun</h3>
            <div className="flex flex-col gap-3">
              <div className="text-xs text-gray-500">Email: <span className="font-bold text-gray-900">{profile?.user?.email}</span></div>
              <button 
                onClick={() => logout()}
                className="w-fit border border-red-200 text-red-600 rounded-xl px-5 py-2 text-sm font-bold hover:bg-red-50 transition-colors"
              >
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
