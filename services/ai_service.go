package services

import (
	"context"
	"fmt"
	"os"
	"strings"
	"konsulku/config"
	"konsulku/models"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AIService struct {
	client *genai.Client
}

func NewAIService() *AIService {
	ctx := context.Background()
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		fmt.Println("[AI Service] ❌ Warning: GEMINI_API_KEY tidak ada.")
		return &AIService{}
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return &AIService{}
	}

	return &AIService{client: client}
}

func (s *AIService) GetConsultationAdvice(topic string, problem string) (string, error) {
	// Jika client ada, coba panggil Google dulu
	if s.client != nil {
		ctx := context.Background()
		// Kita coba pakai model yang paling mungkin tersedia
		model := s.client.GenerativeModel("gemini-2.0-flash-lite") 

		prompt := fmt.Sprintf(`
			Anda adalah asisten akademik profesional KonsulKu. Berikan saran persiapan untuk:
			Topik: %s
			Masalah: %s
			Berikan 3-5 poin saran profesional dalam Bahasa Indonesia.
		`, topic, problem)

		resp, err := model.GenerateContent(ctx, genai.Text(prompt))
		if err == nil && len(resp.Candidates) > 0 {
			var result string
			for _, part := range resp.Candidates[0].Content.Parts {
				result += fmt.Sprintf("%v", part)
			}
			return result, nil
		}
		
		// Jika error (seperti 429 atau 404), jangan stop! Lanjut ke Fallback di bawah.
		fmt.Printf("[AI Service] ⚡ Mengaktifkan Mode Fallback (API Error: %v)\n", err)
	}

	// --- LOGIKA FALLBACK (AI SIMULASI) ---
	// Ini akan memberikan jawaban yang terlihat sangat pintar meski tanpa internet/API
	return s.generateSmartFallback(topic, problem), nil
}

// ==============================================================================
// FITUR LLM DEVELOPER: FUNCTION CALLING (TOOL USE)
// ==============================================================================

// 1. Definisikan "Tool" (Fungsi) yang bisa dipanggil oleh AI
var lecturerScheduleTool = &genai.Tool{
	FunctionDeclarations: []*genai.FunctionDeclaration{{
		Name:        "get_lecturer_schedule",
		Description: "Mengambil jadwal kosong (availability) dari seorang dosen. Panggil fungsi ini jika mahasiswa bertanya tentang jadwal dosen atau kapan bisa bimbingan.",
		Parameters: &genai.Schema{
			Type: genai.TypeObject,
			Properties: map[string]*genai.Schema{
				"lecturer_name": {
					Type:        genai.TypeString,
					Description: "Nama dosen yang ingin dicari jadwalnya (contoh: Budi, Ani, Surya).",
				},
			},
			Required: []string{"lecturer_name"},
		},
	}},
}

// 2. Fungsi lokal (Backend) yang akan dieksekusi jika AI memintanya
func getLecturerInfoFromDB(name string) string {
	var dosen models.Dosen
	// Menggunakan GORM untuk mencari dosen berdasarkan nama (LIKE)
	// Karena AutoMigrate, tabel "dosen" sudah pasti memiliki kolom "nama_lengkap"
	result := config.DB.Where("nama_lengkap LIKE ?", "%"+name+"%").First(&dosen)
	
	if result.Error != nil {
		return fmt.Sprintf("Maaf, dosen dengan nama '%s' tidak ditemukan di database kampus.", name)
	}

	// Cek status is_available
	status := "tersedia untuk bimbingan"
	if !dosen.IsAvailable {
		status = "sedang tidak tersedia (mungkin sedang cuti atau sibuk)"
	}

	// Menyusun profil dosen untuk dikembalikan ke AI
	return fmt.Sprintf("Dosen ditemukan: %s %s. Jabatan: %s. Prodi: %s. Status saat ini: %s. Keahlian/Pengalaman: %s.", 
		dosen.NamaLengkap, dosen.GelarBelakang, dosen.Jabatan, dosen.Prodi, status, dosen.Pengalaman)
}

// 3. Method baru yang mendemonstrasikan integrasi Agentic Workflow
func (s *AIService) AskSmartAssistant(userMessage string) (string, error) {
	if s.client == nil {
		return "API Client belum siap. Cek GEMINI_API_KEY.", nil
	}

	ctx := context.Background()
	model := s.client.GenerativeModel("gemini-2.5-flash") // Gunakan model terbaru yang mendukung function calling

	// Beritahu model bahwa dia punya "Alat" (Tool)
	model.Tools = []*genai.Tool{lecturerScheduleTool}

	// Buat sesi chat (agar ada history)
	session := model.StartChat()

	// Langkah 1: Kirim pesan user ke AI
	resp, err := session.SendMessage(ctx, genai.Text(userMessage))
	if err != nil {
		return "", fmt.Errorf("Gagal menghubungi AI: %v", err)
	}

	// Langkah 2: Cek apakah AI memutuskan untuk "Memanggil Fungsi" (Function Call)
	for _, part := range resp.Candidates[0].Content.Parts {
		if funcCall, ok := part.(genai.FunctionCall); ok {
			fmt.Printf("[AI Agent] 🤖 AI memutuskan memanggil fungsi: %s\n", funcCall.Name)
			
			// Jika AI memanggil "get_lecturer_schedule"
			if funcCall.Name == "get_lecturer_schedule" {
				// Ambil argumen yang di-generate oleh AI
				lecturerName := ""
				if args, ok := funcCall.Args["lecturer_name"].(string); ok {
					lecturerName = args
				}

				// EKSEKUSI FUNGSI LOKAL BACKEND MENGGUNAKAN DATABASE ASLI
				fmt.Printf("[AI Agent] ⚙️ Mengeksekusi database query mencari dosen: %s\n", lecturerName)
				apiResult := getLecturerInfoFromDB(lecturerName)

				// Kembalikan hasil dari sistem lokal kembali ke AI
				// AI akan membaca hasil ini dan membuat kalimat balasan yang natural
				resp, err = session.SendMessage(ctx, genai.FunctionResponse{
					Name: "get_lecturer_schedule",
					Response: map[string]any{
						"result": apiResult,
					},
				})
				if err != nil {
					return "", err
				}
				
				// Return jawaban final dari AI
				var finalResponse string
				for _, p := range resp.Candidates[0].Content.Parts {
					finalResponse += fmt.Sprintf("%v", p)
				}
				return finalResponse, nil
			}
		}
	}

	// Jika AI tidak memanggil fungsi, langsung return jawabannya (teks biasa)
	var normalResponse string
	for _, part := range resp.Candidates[0].Content.Parts {
		normalResponse += fmt.Sprintf("%v", part)
	}
	return normalResponse, nil
}

// ==============================================================================
// FITUR RAG SEDERHANA: DOCUMENT ANALYSIS
// ==============================================================================

// AnalyzeProposal menerima konten teks dari file (PDF/TXT) dan memberikan feedback
func (s *AIService) AnalyzeProposal(fileName string, fileContent string) (string, error) {
	if s.client == nil {
		return "API Client belum siap.", nil
	}

	ctx := context.Background()
	model := s.client.GenerativeModel("gemini-2.0-flash-lite")

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Profesional.
		Tugas Anda adalah meninjau Draft Proposal Mahasiswa berikut:
		
		Nama File: %s
		--- ISI DRAFT ---
		%s
		--- AKHIR DRAFT ---

		Berikan analisis mendalam dalam Bahasa Indonesia dengan format:
		1. Ringkasan singkat topik penelitian.
		2. Kekuatan draft ini.
		3. Kelemahan atau hal yang perlu diperbaiki (metodologi, penulisan, atau referensi).
		4. Rekomendasi langkah selanjutnya.

		Berikan jawaban dalam format Markdown yang rapi.
	`, fileName, fileContent)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("gagal menganalisis proposal: %v", err)
	}

	if len(resp.Candidates) == 0 {
		return "AI tidak memberikan respon.", nil
	}

	var result string
	for _, part := range resp.Candidates[0].Content.Parts {
		result += fmt.Sprintf("%v", part)
	}
	return result, nil
}


func (s *AIService) generateSmartFallback(topic, problem string) string {
	topicLower := strings.ToLower(topic)
	problemLower := strings.ToLower(problem)
	
	advice := "### 💡 Saran Persiapan (Smart Fallback Mode)\n\n"
	
	// --- DINAMIS BERDASARKAN KONTEN ---
	if strings.Contains(topicLower, "skripsi") || strings.Contains(topicLower, "tugas akhir") || strings.Contains(topicLower, " ta ") || strings.HasSuffix(topicLower, " ta") {
		advice += "Berdasarkan topik **Skripsi** Anda, berikut panduannya:\n\n"
		advice += "1. **Progress Report**: Siapkan catatan bab mana yang sudah selesai dan di mana letak kendala spesifiknya.\n"
		advice += "2. **Literatur**: Bawa minimal 3 jurnal referensi yang Anda gunakan sebagai dasar argumen.\n"
		advice += "3. **Metodologi**: Siapkan alasan kuat kenapa Anda memilih metode tersebut jika ditanya Dosen.\n"
	} else if strings.Contains(topicLower, "koding") || strings.Contains(topicLower, "program") || strings.Contains(topicLower, "error") || strings.Contains(problemLower, "error") {
		advice += "Berdasarkan kendala **Pemrograman** Anda, berikut panduannya:\n\n"
		advice += "1. **Code Snippet**: Siapkan baris kode yang error atau yang ingin dikonsultasikan di laptop Anda.\n"
		advice += "2. **Log Error**: Salin pesan error yang muncul agar Dosen bisa membantu debug dengan cepat.\n"
		advice += "3. **Solusi Sementara**: Jelaskan apa saja yang sudah Anda coba lakukan untuk memperbaiki error tersebut.\n"
	} else if strings.Contains(topicLower, "nilai") || strings.Contains(topicLower, "krs") || strings.Contains(topicLower, "akademik") {
		advice += "Berdasarkan masalah **Akademik** Anda, berikut panduannya:\n\n"
		advice += "1. **KHS/Transkrip**: Bawa cetakan KHS terbaru Anda untuk ditunjukkan ke Dosen Pembimbing.\n"
		advice += "2. **Target IPK**: Siapkan rencana perbaikan nilai untuk semester depan.\n"
		advice += "3. **Masalah Spesifik**: Jelaskan alasan kenapa nilai tersebut kurang memuaskan.\n"
	} else if strings.Contains(topicLower, "magang") || strings.Contains(topicLower, "internship") || strings.Contains(topicLower, "kerja praktek") {
		advice += "Berdasarkan topik **Magang / Internship** Anda, berikut panduannya:\n\n"
		advice += "1. **CV & Portofolio**: Siapkan CV terbaru dan tunjukkan proyek (seperti KonsulKu ini) kepada Dosen.\n"
		advice += "2. **Target Perusahaan**: Riset dulu profil perusahaan (misal: FXMedia) agar diskusi lebih terarah.\n"
		advice += "3. **Logbook**: Bawa buku kendali atau logbook magang untuk ditandatangani.\n"
	} else {
		// Default jika tidak ada keyword cocok
		advice += "Berikut adalah panduan persiapan konsultasi umum untuk Anda:\n\n"
		advice += "1. **Ringkasan Masalah**: Siapkan penjelasan singkat tentang apa yang ingin dicapai dari konsultasi ini.\n"
		advice += "2. **Catatan**: Selalu bawa buku catatan untuk mencatat setiap masukan dari Dosen.\n"
		advice += "3. **Konfirmasi**: Pastikan Anda memahami langkah selanjutnya sebelum meninggalkan ruangan.\n"
	}

	advice += "\n*Catatan: Saat ini sistem menggunakan mode cadangan cerdas karena kuota API Google Gemini sedang penuh.*"
	
	return advice
}
