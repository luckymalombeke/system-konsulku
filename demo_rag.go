package main

import (
	"context"
	"fmt"
	"log"
	"math"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

// Fungsi untuk memotong teks panjang menjadi bagian-bagian kecil (Chunking)
func chunkText(text string, chunkSize int) []string {
	words := strings.Fields(text)
	var chunks []string
	var currentChunk []string

	for _, word := range words {
		currentChunk = append(currentChunk, word)
		if len(currentChunk) >= chunkSize {
			chunks = append(chunks, strings.Join(currentChunk, " "))
			currentChunk = nil
		}
	}
	if len(currentChunk) > 0 {
		chunks = append(chunks, strings.Join(currentChunk, " "))
	}
	return chunks
}

// Fungsi menghitung kedekatan makna (Cosine Similarity) antara 2 vector
func cosineSimilarity(a, b []float32) float32 {
	var dotProduct, normA, normB float32
	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return float32(float64(dotProduct) / (math.Sqrt(float64(normA)) * math.Sqrt(float64(normB))))
}

func main() {
	_ = godotenv.Load()
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY tidak ditemukan di .env")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	fmt.Println("=== DEMO RAG (Vector Embeddings) ===")
	
	// 1. ANGGAP INI ADALAH FILE SKRIPSI 100 HALAMAN YANG DI-UPLOAD
	dokumenSkripsi := `
	Sistem Informasi Penjadwalan Dosen Berbasis Web.
	Latar Belakang: Banyak mahasiswa kesulitan menemui dosen.
	Metode Penelitian: Penelitian ini menggunakan metode Waterfall dengan bahasa pemrograman Golang dan React. Database yang digunakan adalah MySQL.
	Kesimpulan: Sistem berhasil mempermudah mahasiswa dalam membuat jadwal.
	`

	// Langkah 1: Chunking (Potong jadi per-paragraf/kalimat)
	fmt.Println("\n[1] Memotong dokumen (Chunking)...")
	chunks := chunkText(dokumenSkripsi, 10) // Potong per 10 kata untuk demo

	// Langkah 2: Mengubah Teks jadi Angka (Embeddings)
	fmt.Println("[2] Mengubah teks menjadi Vector (Embeddings)...")
	em := client.EmbeddingModel("gemini-embedding-2")
	
	var chunkVectors [][]float32
	for _, chunk := range chunks {
		res, err := em.EmbedContent(ctx, genai.Text(chunk))
		if err != nil {
			log.Fatal(err)
		}
		chunkVectors = append(chunkVectors, res.Embedding.Values)
	}

	// 3. Mahasiswa nanya pertanyaan spesifik
	pertanyaan := "Apa metode penelitian yang dipakai di sistem ini?"
	fmt.Println("\nPertanyaan Mahasiswa:", pertanyaan)

	// Ubah pertanyaan jadi Vector juga
	resTanya, _ := em.EmbedContent(ctx, genai.Text(pertanyaan))
	vektorPertanyaan := resTanya.Embedding.Values

	// Langkah 4: Semantic Search (Mencari potongan paling mirip)
	fmt.Println("\n[3] Mencari potongan teks yang paling relevan (Vector Search)...")
	bestScore := float32(-1.0)
	bestChunk := ""

	for i, chunkVec := range chunkVectors {
		score := cosineSimilarity(vektorPertanyaan, chunkVec)
		if score > bestScore {
			bestScore = score
			bestChunk = chunks[i]
		}
	}

	fmt.Printf("Ketemu! Potongan paling relevan (Skor kemiripan: %.2f):\n", bestScore)
	fmt.Printf("=> \"%s\"\n", bestChunk)

	// Langkah 5: Kirim HANYA potongan itu ke Gemini (Hemat Token!)
	fmt.Println("\n[4] Mengirim potongan tersebut ke Gemini untuk dijawab...")
	model := client.GenerativeModel("gemini-2.5-flash")
	prompt := fmt.Sprintf("Berdasarkan teks ini: '%s'. Tolong jawab pertanyaan: '%s'", bestChunk, pertanyaan)
	
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("\nJawaban Akhir AI:")
	for _, cand := range resp.Candidates {
		if cand.Content != nil {
			for _, part := range cand.Content.Parts {
				fmt.Printf("%s", part)
			}
		}
	}
	fmt.Println()
}
