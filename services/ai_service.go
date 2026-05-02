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
	"strings"
)

type AIService struct {
	ApiKey string
	Model  string
}

func NewAIService() *AIService {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		fmt.Println("[AI Service] ❌ Warning: GROQ_API_KEY tidak ada.")
	}
	return &AIService{
		ApiKey: apiKey,
		Model:  "llama-3.3-70b-versatile",
	}
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
		{Role: "system", Content: "Anda adalah KonsulKu AI. Jika pengguna menyebutkan nama dosen, Anda WAJIB memanggil fungsi 'get_lecturer_schedule'. Saat merangkum jawaban, Anda HARUS menampilkan semua detail yang ditemukan (Nama Lengkap, Gelar, Prodi, Status Ketersediaan, dan Jadwal Spesifik) dalam format yang rapi dan profesional. Jangan memberikan jawaban singkat jika data tersedia."},
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

func (s *AIService) AnalyzeProposal(fileName string, fileContent string) (string, error) {
	if s.ApiKey == "" {
		return "API Key Groq belum siap.", nil
	}

	prompt := fmt.Sprintf(`
		Anda adalah Reviewer Akademik Profesional. Tinjau draft proposal ini:
		Nama File: %s
		--- ISI DRAFT ---
		%s
	`, fileName, fileContent)

	messages := []GroqMessage{
		{Role: "user", Content: prompt},
	}

	resp, err := s.callGroq(messages, nil)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "Analisis gagal.", nil
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
