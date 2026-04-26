import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { analyzeProposal } from '../../api';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ArrowRight,
  FileSearch
} from 'lucide-react';

export default function ProposalReview() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Ukuran file maksimal 5MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Silakan pilih file terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeProposal(file);
      setResult(data.analysis);
    } catch (err) {
      setError(err.message || 'Gagal menganalisis proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="mahasiswa">
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              AI Proposal Reviewer
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Dapatkan feedback instan untuk draft proposal skripsi Anda menggunakan kecerdasan buatan.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-[#F0E9FF] text-[#4A1D8F] px-3 py-1.5 rounded-full">
            <CheckCircle size={14} />
            Powered by Gemini RAG
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="md:col-span-1">
            <div className="glass-panel p-6 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={18} className="text-[#4A1D8F]" />
                Upload Draft
              </h3>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 text-center cursor-pointer
                    ${file ? 'border-[#4A1D8F] bg-[#F8F7FF]' : 'border-gray-200 hover:border-[#4A1D8F]'}
                  `}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input 
                    id="file-input"
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".txt,.pdf,.doc,.docx"
                  />
                  
                  {file ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#4A1D8F] text-white rounded-lg flex items-center justify-center mx-auto">
                        <FileText size={20} />
                      </div>
                      <p className="text-xs font-medium text-gray-800 truncate px-2">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center mx-auto">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs text-gray-500">
                        Klik untuk upload draft (PDF/TXT)
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !file}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                    ${loading || !file 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-[#4A1D8F] text-white shadow-lg shadow-[#4A1D8F]/20 hover:scale-[1.02]'}
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      Mulai Analisis
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  AI akan membaca isi file Anda dan memberikan rekomendasi persiapan sebelum bimbingan.
                </p>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="md:col-span-2">
            {!result && !loading ? (
              <div className="glass-panel h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FileSearch className="text-gray-300" size={32} />
                </div>
                <h4 className="text-gray-600 font-medium">Belum Ada Analisis</h4>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">
                  Upload file proposal Anda di samping untuk melihat feedback cerdas dari AI Assistant.
                </p>
              </div>
            ) : loading ? (
              <div className="glass-panel h-[400px] flex flex-col items-center justify-center p-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-[#4A1D8F]/10 border-t-[#4A1D8F] rounded-full animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4A1D8F]" size={24} />
                </div>
                <h4 className="mt-6 font-semibold text-gray-800">Menganalisis Draft Anda</h4>
                <p className="text-gray-500 text-sm mt-2">Ini mungkin memakan waktu beberapa detik...</p>
              </div>
            ) : (
              <div className="glass-panel p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={20} />
                    Hasil Analisis AI
                  </h3>
                  <button 
                    onClick={() => {setResult(null); setFile(null);}}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Reset
                  </button>
                </div>

                <div className="prose prose-sm max-w-none">
                  {/* Sederhana: Pisahkan berdasarkan baris dan render */}
                  {result.split('\n').map((line, i) => {
                    if (line.startsWith('###')) {
                      return <h3 key={i} className="text-lg font-bold text-[#4A1D8F] mt-4 mb-2">{line.replace('###', '')}</h3>;
                    }
                    if (line.startsWith('##')) {
                      return <h2 key={i} className="text-xl font-bold text-[#4A1D8F] mt-6 mb-3">{line.replace('##', '')}</h2>;
                    }
                    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                      return <div key={i} className="flex gap-3 mb-3 bg-white/50 p-3 rounded-lg border border-gray-50">
                        <span className="font-bold text-[#4A1D8F]">{line.split('.')[0]}.</span>
                        <p className="text-gray-700 leading-relaxed">{line.split('.').slice(1).join('.')}</p>
                      </div>;
                    }
                    if (line.startsWith('*') || line.startsWith('-')) {
                      return <li key={i} className="ml-4 mb-1 text-gray-600">{line.replace(/^[\*\-]\s?/, '')}</li>;
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="mb-3 text-gray-700 leading-relaxed">{line}</p>;
                  })}
                </div>

                <div className="mt-8 p-4 bg-[#F8F7FF] rounded-xl border border-[#4A1D8F]/10">
                  <h5 className="text-xs font-bold text-[#4A1D8F] uppercase tracking-wider mb-2">Tips Bimbingan</h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Gunakan hasil analisis ini sebagai bahan diskusi saat bertemu dosen. 
                    Anda bisa menunjukkan bagian yang disorot oleh AI untuk mendapatkan feedback lebih lanjut dari dosen pembimbing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
