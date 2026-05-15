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

func (s *AIService) callGroq(messages []GroqMessage, tools interface{}) (*GroqResponse, error) {
	url := "https://api.groq.com/openai/v1/chat/completions"

	payload := map[string]interface{}{
		"model":    s.Model,
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

	resp, err := s.callGroq(messages, nil)
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

	resp, err := s.callGroq(messages, tools)
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

				// Tambahkan pesan asisten (yang berisi instruksi panggil fungsi) ke history
				messages = append(messages, GroqMessage{
					Role:      "assistant",
					Content:   assistantMsg.Content,
					ToolCalls: assistantMsg.ToolCalls,
				})
				
				// Tambahkan hasil tool (jawaban dari database) ke history
				messages = append(messages, GroqMessage{
					Role:       "tool",
					ToolCallID: toolCall.ID,
					Content:    dbResult,
				})

				// Panggil lagi untuk merangkum (KALI INI TANPA TOOLS agar AI fokus bicara)
				resp2, err := s.callGroq(messages, nil)
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

// AnalyzeProposal menangani evaluasi dokumen proposal menggunakan Groq Llama 3
func (s *AIService) AnalyzeProposal(fileName string, fileContent string) (string, error) {
	if s.ApiKey == "" {
		return "API Key Groq belum di-set di file .env / Railway", nil
	}

	// Gunakan Regex untuk membuang semua karakter selain huruf, angka, tanda baca standar, dan spasi
	reg := regexp.MustCompile(`[^a-zA-Z0-9\s\.,\?\!\(\)\[\]\{\}\:\;\-\_\+\=\/\@\#\$\%\^\&\*\r\n\t]`)
	safeContent := reg.ReplaceAllString(fileContent, "")

	// Batasi teks agar tidak melebihi kuota TPM (Tokens Per Minute) Groq.
	// Karena akun Anda memiliki limit 12.000 TPM, kita set ke 35.000 karakter (~9.000 token)
	// agar aman dan tidak terkena error "Request too large".
	if len(safeContent) > 35000 {
		safeContent = safeContent[:35000] + "... (teks dipotong agar tidak melebihi kuota API Groq)"
	}

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Profesional KonsulKu. Tolong berikan review, evaluasi, dan saran perbaikan yang tajam untuk proposal mahasiswa berikut ini:
		Nama File: %s
		
		--- ISI PROPOSAL ---
		%s
		--- AKHIR PROPOSAL ---
		
		Berikan review dalam Bahasa Indonesia yang mencakup:
		1. Evaluasi Latar Belakang & Urgensi
		2. Evaluasi Rumusan Masalah
		3. Evaluasi Metode Penelitian
		4. Saran Perbaikan Spesifik
	`, fileName, safeContent)

	messages := []GroqMessage{
		{Role: "system", Content: "Anda adalah asisten akademik profesional yang ahli dalam mereview proposal penelitian mahasiswa."},
		{Role: "user", Content: prompt},
	}

	resp, err := s.callGroq(messages, nil)
	if err != nil {
		return "Gagal menganalisis dokumen dengan Groq: " + err.Error(), nil
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "Analisis gagal, Groq tidak memberikan jawaban.", nil
}

// ChatWithProposal menangani tanya jawab interaktif berbasis isi dokumen (RAG)
func (s *AIService) ChatWithProposal(fileName string, fullText string, question string) (string, error) {
	if s.ApiKey == "" {
		return "API Key belum siap.", nil
	}

	// 1. Ambil konteks relevan menggunakan RAG (Embedding + Cosine Similarity)
	// Jika gagal atau teks pendek, kita gunakan fullText sebagai fallback
	contextText, err := s.GetRelevantContext(question, fullText)
	if err != nil || contextText == "" {
		contextText = fullText
		if len(contextText) > 35000 {
			contextText = contextText[:35000]
		}
	}

	// 2. Susun Prompt yang terarah (Targeted Prompt)
	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Profesional KonsulKu. 
		Anda sedang berdiskusi dengan mahasiswa tentang proposalnya yang berjudul: "%s".
		
		BERIKUT ADALAH POTONGAN KONTEKS DOKUMEN YANG RELEVAN:
		---
		%s
		---
		
		PERTANYAAN MAHASISWA: "%s"
		
		Berikan jawaban yang spesifik, bernada akademis, namun tetap suportif berdasarkan potongan dokumen di atas. 
		Jika informasi tidak ditemukan di dokumen tersebut, sampaikan dengan sopan namun tetap berikan saran umum yang relevan untuk penelitian tersebut.
	`, fileName, contextText, question)

	messages := []GroqMessage{
		{Role: "system", Content: "Anda adalah asisten akademik yang membantu mahasiswa memperbaiki proposal penelitian mereka secara interaktif melalui diskusi tanya-jawab."},
		{Role: "user", Content: prompt},
	}

	// 3. Panggil Groq untuk mendapatkan respon
	resp, err := s.callGroq(messages, nil)
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
