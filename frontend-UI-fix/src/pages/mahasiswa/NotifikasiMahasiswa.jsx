import React from 'react';
import { Layout } from '../../components/Layout';
import { BellOff } from 'lucide-react';

export default function NotifikasiMahasiswa() {
  return (
    <Layout variant="mahasiswa">
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifikasi</h1>
        
        <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellOff size={30} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Notifikasi</h3>
          <p className="text-sm text-gray-500">Anda akan menerima pemberitahuan di sini saat ada pembaruan pada appointment Anda.</p>
        </div>
      </div>
    </Layout>
  );
}
