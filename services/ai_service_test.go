package services

import (
	"strings"
	"testing"
)

// TestGenerateSmartFallback mengetes apakah logika cadangan AI (Fallback) 
// memberikan jawaban yang relevan berdasarkan keyword yang dimasukkan.
func TestGenerateSmartFallback(t *testing.T) {
	service := &AIService{}

	// Kumpulan skenario test (Table-Driven Tests - Standar Go Profesional)
	tests := []struct {
		name     string
		topic    string
		problem  string
		expected string // Keyword yang harus ada di jawaban
	}{
		{
			name:     "Skenario Skripsi",
			topic:    "Bimbingan Skripsi Bab 1",
			problem:  "Bingung cari latar belakang",
			expected: "Progress Report",
		},
		{
			name:     "Skenario Koding",
			topic:    "Error Golang",
			problem:  "Gagal koneksi database",
			expected: "Code Snippet",
		},
		{
			name:     "Skenario Magang",
			topic:    "Mencari tempat magang",
			problem:  "Belum punya CV",
			expected: "CV & Portofolio",
		},
		{
			name:     "Skenario Umum",
			topic:    "Konsultasi biasa",
			problem:  "Mau tanya kabar",
			expected: "Ringkasan Masalah",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.generateSmartFallback(tt.topic, tt.problem)
			
			// Cek apakah hasil mengandung kata kunci yang diharapkan
			if !strings.Contains(result, tt.expected) {
				t.Errorf("generateSmartFallback() untuk %s GAGAL.\nEkspektasi mengandung: %s\nHasil: %s", 
					tt.name, tt.expected, result)
			}
		})
	}
}

// TestAnalyzeProposalInput mengetes validasi input (Simulasi)
func TestAnalyzeProposalInput(t *testing.T) {
	service := &AIService{ApiKey: ""} // ApiKey kosong untuk simulasi luring/error API

	res, err := service.AnalyzeProposal("draft.txt", "Isi proposal palsu", "")
	
	if err != nil {
		t.Errorf("AnalyzeProposal harusnya tidak mengembalikan error saat API key kosong, melainkan string fallback: %v", err)
	}

	if !strings.Contains(res, "GROQ_API_KEY") {
		t.Errorf("Ekspektasi pesan 'GROQ_API_KEY belum di-set di file .env', tetapi hasil: %s", res)
	}
}
