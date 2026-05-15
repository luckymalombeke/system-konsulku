package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"konsulku/config"
	"konsulku/models"
	"math"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
	"context"
)

type AIService struct {
	ApiKey       string
	GeminiApiKey string
	Model        string
}
// Fungsi untuk memotong teks panjang (Chunking)
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

// Fungsi menghitung kedekatan makna (Cosine Similarity)
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

func NewAIService() *AIService {
	apiKey := os.Getenv("GROQ_API_KEY")
	geminiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		fmt.Println("[AI Service] ❌ Warning: GROQ_API_KEY tidak ada.")
	}
	return &AIService{
		ApiKey:       apiKey,
		GeminiApiKey: geminiKey,
		Model:        "llama-3.3-70b-versatile",
	}
}

// GetEmbedding mengubah teks menjadi vector menggunakan Google Gemini Embedding
func (s *AIService) GetEmbedding(text string) ([]float32, error) {
	if s.GeminiApiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY belum di-set")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(s.GeminiApiKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	em := client.EmbeddingModel("text-embedding-004")
	res, err := em.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		return nil, err
	}

	return res.Embedding.Values, nil
}

// GetRelevantContext mencari potongan teks paling relevan dari sebuah dokumen (RAG)
func (s *AIService) GetRelevantContext(query string, fullText string) (string, error) {
	// 1. Chunking dokumen (potong per 300 kata agar konteks tetap terjaga)
	chunks := chunkText(fullText, 300)
	if len(chunks) == 0 {
		return "", nil
	}

	// 2. Dapatkan Embedding untuk Query (Pertanyaan)
	queryVec, err := s.GetEmbedding(query)
	if err != nil {
		return "", err
	}

	// 3. Loop untuk mencari chunk paling relevan (Semantic Search)
	bestScore := float32(-1.0)
	bestChunk := ""

	for _, chunk := range chunks {
		chunkVec, err := s.GetEmbedding(chunk)
		if err != nil {
			continue // Skip jika gagal
		}

		score := cosineSimilarity(queryVec, chunkVec)
		if score > bestScore {
			bestScore = score
			bestChunk = chunk
		}
	}

	return bestChunk, nil
}

// Groq Structures - Updated for better compatibility
type GroqMessage struct {
	Role       string          `json:"role"`
	Content    string          `json:"content"`
	ToolCalls  []GroqToolCall  `json:"tool_calls,omitempty"`
	ToolCallID string          `json:"tool_call_id,omitempty"`
}

type GroqToolCall struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Function struct {
		Name      string `json:"name"`
		Arguments string `json:"arguments"`
	} `json:"function"`
}

type GroqResponse struct {
	Choices []struct {
		Message GroqMessage `json:"message"`
	} `json:"choices"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (s *AIService) callGroq(messages []GroqMessage, tools interface{}, modelName string) (*GroqResponse, error) {
	url := "https://api.groq.com/openai/v1/chat/completions"

	// Jika modelName kosong, gunakan default dari service
	selectedModel := modelName
	if selectedModel == "" {
		selectedModel = s.Model
	}

	payload := map[string]interface{}{
		"model":    selectedModel,
		"messages": messages,
	}
	if tools != nil {
		payload["tools"] = tools
		payload["tool_choice"] = "auto"
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.ApiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API Error (%d): %s", resp.StatusCode, groqResp.Error.Message)
	}

	return &groqResp, nil
}

func (s *AIService) GetConsultationAdvice(topic string, problem string) (string, error) {
	if s.ApiKey == "" {
		return s.generateSmartFallback(topic, problem), nil
	}

	prompt := fmt.Sprintf(`
		Anda adalah asisten akademik profesional KonsulKu. Berikan saran persiapan untuk:
		Topik: %s
		Masalah: %s
		Berikan 3-5 poin saran profesional dalam Bahasa Indonesia.
	`, topic, problem)

	messages := []GroqMessage{
		{Role: "user", Content: prompt},
	}

	// Gunakan model 8b untuk saran cepat
	resp, err := s.callGroq(messages, nil, "llama-3.1-8b-instant")
	if err != nil {
		return s.generateSmartFallback(topic, problem), nil
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return s.generateSmartFallback(topic, problem), nil
}

func (s *AIService) AskSmartAssistant(userMessage string) (string, error) {
	if s.ApiKey == "" {
		return "API Key Groq belum siap.", nil
	}

	tools := []interface{}{
		map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name":        "get_lecturer_schedule",
				"description": "Cek jadwal dosen di database.",
				"parameters": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"lecturer_name": map[string]interface{}{
							"type":        "string",
							"description": "Nama dosen (contoh: Semmy).",
						},
					},
					"required": []string{"lecturer_name"},
				},
			},
		},
	}

	messages := []GroqMessage{
		{Role: "system", Content: "Anda adalah KonsulKu AI, asisten akademik kampus. Anda HANYA boleh menjawab pertanyaan terkait urusan kampus, bimbingan, jadwal dosen, atau topik akademik. Jika pengguna bertanya hal di luar itu (seperti politik, presiden, resep masakan, dll), tolak dengan sopan dan ingatkan peran Anda. Jika pengguna menyebutkan nama dosen, Anda WAJIB memanggil fungsi 'get_lecturer_schedule'. Saat merangkum jawaban dari database, Anda HARUS menampilkan semua detail yang ditemukan dalam format yang rapi."},
		{Role: "user", Content: userMessage},
	}

	// Gunakan model 8b untuk asisten umum (lebih hemat & cepat)
	resp, err := s.callGroq(messages, tools, "llama-3.1-8b-instant")
	if err != nil {
		return "Gagal di panggilan pertama: " + err.Error(), nil
	}

	if len(resp.Choices) > 0 {
		assistantMsg := resp.Choices[0].Message
		
		if len(assistantMsg.ToolCalls) > 0 {
			toolCall := assistantMsg.ToolCalls[0]
			
			if toolCall.Function.Name == "get_lecturer_schedule" {
				var args struct {
					LecturerName string `json:"lecturer_name"`
				}
				json.Unmarshal([]byte(toolCall.Function.Arguments), &args)

				dbResult := getLecturerInfoFromDB(args.LecturerName)

				messages = append(messages, GroqMessage{
					Role:      "assistant",
					Content:   assistantMsg.Content,
					ToolCalls: assistantMsg.ToolCalls,
				})
				
				messages = append(messages, GroqMessage{
					Role:       "tool",
					ToolCallID: toolCall.ID,
					Content:    dbResult,
				})

				resp2, err := s.callGroq(messages, nil, "llama-3.1-8b-instant")
				if err != nil {
					return "Gagal merangkum jawaban: " + err.Error(), nil
				}
				
				if len(resp2.Choices) > 0 {
					content := resp2.Choices[0].Message.Content
					if content != "" {
						return content, nil
					}
				}
				return "Saya sudah menemukan datanya, tapi gagal merangkumnya. Silakan tanya lagi.", nil
			}
		}
		
		if assistantMsg.Content != "" {
			return assistantMsg.Content, nil
		}
	}

	return "Maaf, AI tidak memberikan respon (Empty Choices).", nil
}

// AnalyzeProposal menangani evaluasi dokumen proposal menggunakan Google Gemini 1.5 Flash (Kapasitas Besar)
func (s *AIService) AnalyzeProposal(fileName string, fileContent string) (string, error) {
	if s.GeminiApiKey == "" {
		return "GEMINI_API_KEY belum di-set di file .env", nil
	}

	reg := regexp.MustCompile(`[^a-zA-Z0-9\s\.,\?\!\(\)\[\]\{\}\:\;\-\_\+\=\/\@\#\$\%\^\&\*\r\n\t]`)
	safeContent := reg.ReplaceAllString(fileContent, "")

	// Gemini 1.5 Flash punya limit 1 Juta Token. 
	// Kita set batas ke 1.000.000 karakter (sangat cukup untuk skripsi tebal)
	if len(safeContent) > 1000000 {
		safeContent = safeContent[:1000000] + "... (teks sangat panjang dipotong pada 1 juta karakter)"
	}

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik yang Sangat Kritis dan Teliti (Dosen Pembimbing Senior). 
		Tugas Anda adalah membedah proposal mahasiswa berikut dan mencari KEJANGGALAN serta KETIDAKSINKRONAN antar bagian.
		
		Nama File: %s
		
		--- ISI PROPOSAL ---
		%s
		--- AKHIR PROPOSAL ---
		
		Tolong berikan analisis tajam dalam Bahasa Indonesia dengan format berikut:
		
		### 🔍 ANALISIS SINKRONISASI (CRITICAL)
		Cek apakah Judul, Rumusan Masalah, dan Tujuan sudah sinkron. Cari jika ada kontradiksi.
		
		### ⚠️ KEJANGGALAN & KRITIK PEDAS
		1. Evaluasi Latar Belakang: Apakah masalahnya nyata atau hanya dibuat-buat? Apakah urgensinya terlihat?
		2. Evaluasi Metode: Apakah metode ini BENAR-BENAR bisa menjawab rumusan masalah di atas? Sebutkan jika ada ketidakcocokan.
		
		### 💡 REKOMENDASI PERBAIKAN DARURAT
		Berikan langkah konkret yang harus dilakukan mahasiswa agar proposal ini layak diajukan ke sidang.
	`, fileName, safeContent)

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(s.GeminiApiKey))
	if err != nil {
		return "", fmt.Errorf("gagal inisialisasi Gemini: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	
	// Set temperature rendah agar analisis tetap fokus dan akademis
	model.SetTemperature(0.3)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("error Gemini: %v", err)
	}

	if len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil {
		var fullResponse strings.Builder
		for _, part := range resp.Candidates[0].Content.Parts {
			fullResponse.WriteString(fmt.Sprintf("%v", part))
		}
		return fullResponse.String(), nil
	}

	return "Analisis gagal, Gemini tidak memberikan jawaban.", nil
}

// ChatWithProposal menangani tanya jawab interaktif berbasis isi dokumen (RAG)
func (s *AIService) ChatWithProposal(fileName string, fullText string, question string) (string, error) {
	if s.ApiKey == "" {
		return "API Key belum siap.", nil
	}

	contextText, err := s.GetRelevantContext(question, fullText)
	if err != nil || contextText == "" {
		contextText = fullText
		if len(contextText) > 8000 {
			contextText = contextText[:8000]
		}
	}

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Profesional KonsulKu. 
		Anda sedang berdiskusi dengan mahasiswa tentang proposalnya yang berjudul: "%s".
		
		BERIKUT ADALAH POTONGAN KONTEKS DOKUMEN YANG RELEVAN:
		---
		%s
		---
		
		PERTANYAAN MAHASISWA: "%s"
		
		Berikan jawaban yang spesifik, bernada akademis, namun tetap suportif berdasarkan potongan dokumen di atas.
	`, fileName, contextText, question)

	messages := []GroqMessage{
		{Role: "system", Content: "Anda adalah asisten akademik yang membantu mahasiswa memperbaiki proposal penelitian mereka secara interaktif melalui diskusi tanya-jawab."},
		{Role: "user", Content: prompt},
	}

	// PAKAI MODEL 8B UNTUK CHAT INTERAKTIF (CEPAT & LIMIT TINGGI)
	resp, err := s.callGroq(messages, nil, "llama-3.1-8b-instant")
	if err != nil {
		return "Gagal mendapatkan respon dari AI: " + err.Error(), nil
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "Maaf, AI tidak memberikan respon spesifik saat ini.", nil
}

func getLecturerInfoFromDB(name string) string {
	cleanName := strings.TrimSpace(name)
	prefixes := []string{"Pak ", "Ibu ", "Sir ", "Ms ", "Mr ", "Meneer "}
	for _, p := range prefixes {
		if strings.HasPrefix(strings.ToLower(cleanName), strings.ToLower(p)) {
			cleanName = cleanName[len(p):]
		}
	}

	var dosen models.Dosen
	// Gunakan Find().Limit(1) agar tidak muncul error 'record not found' berwarna merah di terminal jika tidak ketemu
	result := config.DB.Where("LOWER(nama_lengkap) LIKE LOWER(?)", "%"+cleanName+"%").Limit(1).Find(&dosen)
	
	// Cek apakah ada data yang ditemukan (RowsAffected > 0)
	if result.RowsAffected == 0 {
		// Jika tidak ditemukan, coba ambil 3 nama dosen yang ada sebagai referensi
		var allDosen []models.Dosen
		config.DB.Select("nama_lengkap").Limit(3).Find(&allDosen)
		
		names := []string{}
		for _, d := range allDosen {
			names = append(names, d.NamaLengkap)
		}
		
		return fmt.Sprintf("Dosen '%s' tidak ditemukan. Dosen yang tersedia di database antara lain: %s. Pastikan ejaan nama benar.", cleanName, strings.Join(names, ", "))
	}

	status := "Tersedia"
	if !dosen.IsAvailable {
		status = "Tidak Tersedia"
	}

	return fmt.Sprintf("Dosen: %s %s. Prodi: %s. Status: %s. Jadwal: %s.", 
		dosen.NamaLengkap, dosen.GelarBelakang, dosen.Prodi, status, dosen.CatatanJadwal)
}

func (s *AIService) generateSmartFallback(topic, problem string) string {
	return "### 💡 Saran (Offline)\n1. Siapkan bahan bimbingan."
}

// Helper function
func stringPtr(s string) *string {
	return &s
}
