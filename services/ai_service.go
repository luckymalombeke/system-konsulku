package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"konsulku/config"
	"konsulku/models"
	"net/http"
	"os"
	"regexp"
	"strings"
)

type AIService struct {
	ApiKey     string
	ChatApiKey string
	Model      string
	ChatModel  string
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

func NewAIService() *AIService {
	apiKey := os.Getenv("GROQ_API_KEY")
	chatKey := os.Getenv("GROQ_API_KEY_CHAT")

	if apiKey == "" {
		fmt.Println("[AI Service] ❌ Warning: GROQ_API_KEY tidak ada.")
	}
	// Fallback jika chatKey tidak ada, gunakan apiKey biasa
	if chatKey == "" {
		chatKey = apiKey
	}

	model := os.Getenv("GROQ_AI_MODEL")
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}

	chatModel := os.Getenv("GROQ_CHAT_MODEL")
	if chatModel == "" {
		chatModel = "llama-3.1-8b-instant"
	}

	return &AIService{
		ApiKey:     apiKey,
		ChatApiKey: chatKey,
		Model:      model,
		ChatModel:  chatModel,
	}
}

// GetRelevantContext mencari beberapa potongan teks paling relevan menggunakan Keyword Matching (Multi-Context)
func (s *AIService) GetRelevantContext(query string, fullText string) ([]string, error) {
	chunks := chunkText(fullText, 300)
	if len(chunks) == 0 {
		return nil, nil
	}

	type ScoredChunk struct {
		Chunk string
		Score int
	}
	var scoredChunks []ScoredChunk

	queryWords := strings.Fields(strings.ToLower(query))

	for _, chunk := range chunks {
		score := 0
		lowerChunk := strings.ToLower(chunk)
		for _, word := range queryWords {
			if len(word) >= 3 && strings.Contains(lowerChunk, word) {
				score += 2
			}
			if regexp.MustCompile(`\d+`).MatchString(word) && strings.Contains(lowerChunk, word) {
				score += 3
			}
		}
		if score > 0 {
			scoredChunks = append(scoredChunks, ScoredChunk{Chunk: chunk, Score: score})
		}
	}

	// Urutkan berdasarkan skor tertinggi
	for i := 0; i < len(scoredChunks); i++ {
		for j := i + 1; j < len(scoredChunks); j++ {
			if scoredChunks[i].Score < scoredChunks[j].Score {
				scoredChunks[i], scoredChunks[j] = scoredChunks[j], scoredChunks[i]
			}
		}
	}

	// Ambil top 3
	var result []string
	limit := 3
	if len(scoredChunks) < limit {
		limit = len(scoredChunks)
	}
	for i := 0; i < limit; i++ {
		result = append(result, scoredChunks[i].Chunk)
	}

	return result, nil
}

// Groq Structures
type GroqMessage struct {
	Role       string         `json:"role"`
	Content    string         `json:"content"`
	ToolCalls  []GroqToolCall `json:"tool_calls,omitempty"`
	ToolCallID string         `json:"tool_call_id,omitempty"`
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

func (s *AIService) callGroq(messages []GroqMessage, tools interface{}, modelName string, specificApiKey string) (*GroqResponse, error) {
	url := "https://api.groq.com/openai/v1/chat/completions"

	selectedModel := modelName
	if selectedModel == "" {
		selectedModel = s.Model
	}

	finalApiKey := specificApiKey
	if finalApiKey == "" {
		finalApiKey = s.ApiKey
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
	req.Header.Set("Authorization", "Bearer "+finalApiKey)

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

// generateSmartFallback memberikan saran lokal jika API Key Groq tidak diatur
func (s *AIService) generateSmartFallback(topic string, problem string) string {
	tLower := strings.ToLower(topic)
	pLower := strings.ToLower(problem)

	if strings.Contains(tLower, "skripsi") || strings.Contains(pLower, "skripsi") || strings.Contains(tLower, "latar belakang") || strings.Contains(pLower, "latar belakang") {
		return "### 💡 Saran Akademik (Offline Fallback)\nSaran untuk topik: " + topic + "\nMasalah: " + problem + "\n\n1. Kumpulkan data pendukung untuk Bab 1 skripsi.\n2. Tulis draf Progress Report bimbingan Anda secara terstruktur.\n3. Diskusikan batasan masalah dengan dosen pembimbing."
	}

	if strings.Contains(tLower, "golang") || strings.Contains(pLower, "golang") || strings.Contains(tLower, "database") || strings.Contains(pLower, "database") || strings.Contains(tLower, "koding") || strings.Contains(pLower, "koding") {
		return "### 💡 Saran Teknis (Offline Fallback)\nSaran untuk topik: " + topic + "\nMasalah: " + problem + "\n\n1. Periksa kembali string koneksi database Anda di file config.\n2. Berikut contoh Code Snippet penanganan error koneksi di Go.\n3. Jalankan unit test untuk memastikan kegagalan terisolasi."
	}

	if strings.Contains(tLower, "magang") || strings.Contains(pLower, "magang") || strings.Contains(tLower, "cv") || strings.Contains(pLower, "cv") {
		return "### 💡 Saran Karir (Offline Fallback)\nSaran untuk topik: " + topic + "\nMasalah: " + problem + "\n\n1. Buat CV & Portofolio yang relevan dengan posisi magang.\n2. Cari informasi lowongan magang melalui karir kampus.\n3. Persiapkan berkas administrasi pendukung."
	}

	return "### 💡 Saran Umum (Offline Fallback)\nSaran untuk topik: " + topic + "\nMasalah: " + problem + "\n\n1. Buat Ringkasan Masalah konsultasi Anda.\n2. Siapkan pertanyaan cadangan sebelum bimbingan.\n3. Atur janji temu ulang jika dosen berhalangan."
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

	resp, err := s.callGroq(messages, nil, s.ChatModel, s.ChatApiKey)
	if err != nil {
		return "### 💡 Saran (Offline)\n1. Siapkan bahan bimbingan.", nil
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "### 💡 Saran (Offline)\n1. Siapkan bahan bimbingan.", nil
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
		{Role: "system", Content: "Anda adalah KonsulKu AI, asisten akademik dan mentor cerdas bagi mahasiswa. Tugas Anda adalah membantu mahasiswa dalam: 1. Navigasi Kampus (Jadwal dosen, prosedur, magang). 2. Bimbingan Skripsi (Judul, masalah, metode). 3. Etika & Karir (Cara chat dosen, persiapan kerja, soft skills). Berikan jawaban yang kreatif, solutif, dan mendalam. Gunakan nada bicara yang ramah dan suportif seperti mentor. HANYA tolak pertanyaan yang benar-benar tidak relevan dengan kehidupan mahasiswa (seperti politik, resep masakan, atau hiburan). Jika pengguna menyebutkan nama dosen, Anda WAJIB memanggil fungsi 'get_lecturer_schedule'."},
		{Role: "user", Content: userMessage},
	}

	resp, err := s.callGroq(messages, tools, s.ChatModel, s.ChatApiKey)
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

				resp2, err := s.callGroq(messages, nil, s.ChatModel, s.ChatApiKey)
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

// GetLecturerChatContext mengambil riwayat chat terakhir antara mahasiswa dan dosen
func (s *AIService) GetLecturerChatContext(userID uint) string {
	var mhs models.Mahasiswa
	if err := config.DB.Where("user_id = ?", userID).First(&mhs).Error; err != nil {
		return ""
	}

	var chat models.KonsultasiChat
	// Ambil chat terakhir mahasiswa ini
	if err := config.DB.Where("mahasiswa_id = ?", mhs.ID).Order("dibuat_pada DESC").First(&chat).Error; err != nil {
		return ""
	}

	var pesan []models.Pesan
	// Ambil 15 pesan terakhir agar AI punya konteks bimbingan nyata
	config.DB.Where("chat_id = ?", chat.ID).Order("dikirim_at DESC").Limit(15).Find(&pesan)

	if len(pesan) == 0 {
		return ""
	}

	var chatBuilder strings.Builder
	chatBuilder.WriteString("\n--- RIWAYAT BIMBINGAN NYATA DENGAN DOSEN ---\n")
	// Balik urutan agar kronologis (dari lama ke baru)
	for i := len(pesan) - 1; i >= 0; i-- {
		role := "Mahasiswa"
		if pesan[i].PengirimID != userID {
			role = "Dosen"
		}
		chatBuilder.WriteString(fmt.Sprintf("%s: %s\n", role, pesan[i].Teks))
	}
	chatBuilder.WriteString("--- AKHIR RIWAYAT ---\n")

	return chatBuilder.String()
}

// AnalyzeProposal menangani evaluasi dokumen proposal menggunakan Groq Llama 3.3 70B (Pengganti Gemini)
func (s *AIService) AnalyzeProposal(fileName string, fileContent string, chatContext string) (string, error) {
	if s.ApiKey == "" {
		return "GROQ_API_KEY belum di-set di file .env", nil
	}

	reg := regexp.MustCompile(`[^a-zA-Z0-9\s\.,\?\!\(\)\[\]\{\}\:\;\-\_\+\=\/\@\#\$\%\^\&\*\r\n\t]`)
	safeContent := reg.ReplaceAllString(fileContent, "")

	if len(safeContent) > 30000 {
		safeContent = safeContent[:30000] + "... (teks dipotong)"
	}

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Senior KonsulKu. 
		Tugas Anda: Bedah proposal ini dan cari KEJANGGALAN.
		
		%s
		
		PENTING: Jika ada "RIWAYAT BIMBINGAN NYATA" di atas, Anda WAJIB menyelaraskan kritik Anda dengan arahan dosen tersebut. Jangan memberi saran yang bertentangan dengan apa yang sudah diminta dosen di chat.
		
		Nama File: %s
		--- ISI PROPOSAL ---
		%s
		--- AKHIR PROPOSAL ---
		
		Format Analisis (Bahasa Indonesia):
		### 🔍 ANALISIS SINKRONISASI (CRITICAL)
		### ⚠️ KEJANGGALAN & KRITIK TAJAM
		### 💡 REKOMENDASI PERBAIKAN (SESUAI ARAHAN DOSEN)
	`, chatContext, fileName, safeContent)

	messages := []GroqMessage{{Role: "user", Content: prompt}}
	resp, err := s.callGroq(messages, nil, s.Model, s.ApiKey)
	if err != nil {
		return "Gagal menganalisis proposal: " + err.Error(), nil
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}
	return "Analisis gagal.", nil
}

// ChatWithProposal menangani tanya jawab interaktif berbasis isi dokumen (RAG)
func (s *AIService) ChatWithProposal(fileName string, fullText string, question string, chatContext string) (string, error) {
	if s.ApiKey == "" {
		return "API Key belum siap.", nil
	}

	relevantChunks, err := s.GetRelevantContext(question, fullText)
	var contextText string

	if err != nil || len(relevantChunks) == 0 {
		contextText = fullText
		if len(contextText) > 10000 {
			contextText = contextText[:10000]
		}
	} else {
		contextText = strings.Join(relevantChunks, "\n---\n")
	}

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Profesional KonsulKu.
		
		%s
		
		KONTEKS DOKUMEN RELEVAN:
		%s
		
		PERTANYAAN MAHASISWA: "%s"
		
		Tugas: Jawab pertanyaan mahasiswa berdasarkan isi dokumen DAN pertimbangkan riwayat chat dengan dosen di atas agar jawaban Anda tidak menyesatkan mahasiswa dari keinginan dosen pembimbingnya.
	`, chatContext, contextText, question)

	messages := []GroqMessage{
		{Role: "system", Content: "Anda adalah asisten akademik yang membantu mahasiswa memperbaiki proposal penelitian mereka dengan mempertimbangkan masukan dosen asli."},
		{Role: "user", Content: prompt},
	}

	resp, err := s.callGroq(messages, nil, s.ChatModel, s.ChatApiKey)
	if err != nil {
		return "Gagal mendapatkan respon dari AI: " + err.Error(), nil
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}
	return "Maaf, AI tidak memberikan respon.", nil
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
	result := config.DB.Where("LOWER(nama_lengkap) LIKE LOWER(?)", "%"+cleanName+"%").Limit(1).Find(&dosen)

	if result.RowsAffected == 0 {
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
