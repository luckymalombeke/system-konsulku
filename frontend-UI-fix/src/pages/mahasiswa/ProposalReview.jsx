import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { analyzeProposal, chatWithProposal } from '../../api';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ArrowRight,
  FileSearch,
  Send,
  User,
  Bot
} from 'lucide-react';

export default function ProposalReview() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState(null);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Ukuran file maksimal 10MB');
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
    setChatMessages([]);

    try {
      const data = await analyzeProposal(file);
      setResult(data.analysis);
      setExtractedText(data.extractedText);
    } catch (err) {
      setError(err.message || 'Gagal menganalisis proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim() || chatLoading) return;

    const userQ = question.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setChatLoading(true);

    try {
      const data = await chatWithProposal(file.name, extractedText, userQ);
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'error', content: 'Gagal mendapatkan jawaban: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;

    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const content = `
      <html>
        <head>
          <title>Laporan Review AI - ${file?.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #4A1D8F; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #4A1D8F; margin: 0; font-size: 24px; }
            .meta { font-size: 12px; color: #666; margin-top: 10px; }
            .section { margin-bottom: 25px; }
            h3 { color: #4A1D8F; border-left: 4px solid #4A1D8F; padding-left: 10px; margin-top: 30px; }
            p, div, li { font-size: 14px; text-align: justify; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN ANALISIS AKADEMIK AI</h1>
            <div class="meta">
              Aplikasi KonsulKu • Dokumen: ${file?.name} • Tanggal: ${date}
            </div>
          </div>
          <div class="content">
            ${result.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
          <div class="footer">
            Laporan ini dihasilkan secara otomatis oleh KonsulKu AI (Groq Llama 3.3 Engine).<br/>
            Gunakan laporan ini sebagai panduan revisi akademik.
          </div>
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const formatAIResponse = (text) => {
    return text.split('\n').map((line, i) => {
      const formatBold = (t) => ({ __html: t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') });

      if (line.startsWith('###')) {
        return <h3 key={i} className="text-lg font-bold text-[#4A1D8F] mt-4 mb-2" dangerouslySetInnerHTML={formatBold(line.replace('###', ''))} />;
      }
      if (line.startsWith('##')) {
        return <h2 key={i} className="text-xl font-bold text-[#4A1D8F] mt-6 mb-3" dangerouslySetInnerHTML={formatBold(line.replace('##', ''))} />;
      }
      if (line.match(/^\d+\./)) {
        const num = line.split('.')[0];
        const content = line.substring(line.indexOf('.') + 1);
        return <div key={i} className="flex gap-3 mb-3 bg-white/50 p-3 rounded-lg border border-gray-50">
          <span className="font-bold text-[#4A1D8F]">{num}.</span>
          <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={formatBold(content)} />
        </div>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={i} className="ml-4 mb-1 text-gray-600" dangerouslySetInnerHTML={formatBold(line.replace(/^[\*\-]\s?/, ''))} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-3 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={formatBold(line)} />;
    });
  };

  return (
    <Layout role="mahasiswa">
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              AI Proposal Expert
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Analisis mendalam dan diskusi interaktif untuk proposal skripsi Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-[#F0E9FF] text-[#4A1D8F] px-3 py-1.5 rounded-full border border-[#4A1D8F]/10">
            <CheckCircle size={14} />
            Groq Llama 3.3 + RAG
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
                    accept=".txt,.pdf,.docx"
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
                        Klik untuk upload draft (PDF/DOCX)
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
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="md:col-span-2 space-y-6">
            {!result && !loading ? (
              <div className="glass-panel h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FileSearch className="text-gray-300" size={32} />
                </div>
                <h4 className="text-gray-600 font-medium">Belum Ada Analisis</h4>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">
                  Upload file proposal Anda di samping untuk mendapatkan feedback instan dan diskusi interaktif.
                </p>
              </div>
            ) : loading ? (
              <div className="glass-panel h-[400px] flex flex-col items-center justify-center p-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-[#4A1D8F]/10 border-t-[#4A1D8F] rounded-full animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4A1D8F]" size={24} />
                </div>
                <h4 className="mt-6 font-semibold text-gray-800">Menganalisis Draft Anda</h4>
                <p className="text-gray-500 text-sm mt-2">Menyiapkan review akademik mendalam...</p>
              </div>
            ) : (
              <>
                <div className="glass-panel p-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={20} />
                      Review Utama AI
                    </h3>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleExport}
                        className="text-xs flex items-center gap-1.5 bg-[#F0E9FF] text-[#4A1D8F] px-3 py-1.5 rounded-lg font-semibold hover:bg-[#4A1D8F] hover:text-white transition-all"
                      >
                        <FileText size={14} />
                        Cetak Laporan
                      </button>
                      <button 
                        onClick={() => {setResult(null); setFile(null); setChatMessages([]);}}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {formatAIResponse(result)}
                  </div>
                </div>

                {/* Interactive Chat Section */}
                <div className="glass-panel p-6 animate-fade-in border-t-4 border-t-[#4A1D8F]">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-[#4A1D8F] text-white rounded-lg flex items-center justify-center">
                      <Bot size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Tanya Jawab Proposal</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Powered by RAG Engine</p>
                    </div>
                  </div>

                  {/* Chat History */}
                  <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">Ada bagian yang kurang jelas? Tanyakan langsung di bawah!</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
                          {["Apa saran untuk Bab 3?", "Apakah judulnya sudah oke?", "Metode apa yang cocok?"].map((tip, idx) => (
                            <button 
                              key={idx}
                              onClick={() => setQuestion(tip)}
                              className="text-[10px] bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-500 hover:border-[#4A1D8F] hover:text-[#4A1D8F] transition-all"
                            >
                              {tip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-[#4A1D8F] text-white rounded-tr-none' 
                            : msg.role === 'error'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-1 opacity-70">
                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                            <span className="text-[10px] font-bold uppercase">{msg.role === 'user' ? 'Anda' : 'AI Assistant'}</span>
                          </div>
                          <div className="leading-relaxed">
                            {msg.role === 'assistant' ? formatAIResponse(msg.content) : msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-[#4A1D8F]" />
                          <span className="text-xs text-gray-500">Berpikir...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleChat} className="relative">
                    <input 
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Tanyakan sesuatu tentang proposal Anda..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#4A1D8F]/20 focus:border-[#4A1D8F] outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!question.trim() || chatLoading}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                        ${!question.trim() || chatLoading ? 'text-gray-300' : 'bg-[#4A1D8F] text-white shadow-md hover:scale-105'}
                      `}
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
