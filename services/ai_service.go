package services

import (
	"context"
	"fmt"
	"os"
	"strings"

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

func (s *AIService) generateSmartFallback(topic, problem string) string {
	topicLower := strings.ToLower(topic)
	problemLower := strings.ToLower(problem)
	
	advice := "### 💡 Saran Persiapan (Smart Fallback Mode)\n\n"
	
	// --- DINAMIS BERDASARKAN KONTEN ---
	if strings.Contains(topicLower, "skripsi") || strings.Contains(topicLower, "tugas akhir") || strings.Contains(topicLower, "ta") {
		advice += "Berdasarkan topik **Skripsi** Anda, berikut panduannya:\n\n"
		advice += "1. **Progress Report**: Siapkan catatan bab mana yang sudah selesai dan di mana letak kendala spesifiknya.\n"
		advice += "2. **Literatur**: Bawa minimal 3 jurnal referensi yang Anda gunakan sebagai dasar argumen.\n"
		advice += "3. **Metodologi**: Siapkan alasan kuat kenapa Anda memilih metode tersebut jika ditanya Dosen.\n"
	} else if strings.Contains(topicLower, "koding") || strings.Contains(topicLower, "program") || strings.Contains(problemLower, "error") {
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
