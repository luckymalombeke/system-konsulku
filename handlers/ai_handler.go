package handlers

import (
	"io"
	"konsulku/services"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

var (
	aiService     *services.AIService
	aiServiceOnce sync.Once
)

// GetAIService memastikan service hanya dibuat satu kali (Lazy Loading)
// dan sudah membaca .env saat dibutuhkan pertama kali
func GetAIService() *services.AIService {
	aiServiceOnce.Do(func() {
		aiService = services.NewAIService()
	})
	return aiService
}

type AIRequest struct {
	Topic   string `json:"topic" binding:"required"`
	Problem string `json:"problem" binding:"required"`
}

func HandleAIAdvice(c *gin.Context) {
	var req AIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Topik dan Masalah harus diisi"})
		return
	}

	// Gunakan GetAIService() di sini
	service := GetAIService()
	advice, err := service.GetConsultationAdvice(req.Topic, req.Problem)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungi AI: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"advice": advice,
	})
}

// Struct untuk request chat cerdas
type AIChatRequest struct {
	Message string `json:"message" binding:"required"`
}

// HandleSmartAssistant memproses chat bebas dan bisa memanggil function
func HandleSmartAssistant(c *gin.Context) {
	var req AIChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesan tidak boleh kosong"})
		return
	}

	service := GetAIService()
	response, err := service.AskSmartAssistant(req.Message)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungi Smart Assistant: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}

// HandleProposalAnalysis menangani upload file proposal mahasiswa
func HandleProposalAnalysis(c *gin.Context) {
	file, header, err := c.Request.FormFile("proposal")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File proposal wajib diunggah"})
		return
	}
	defer file.Close()

	// Baca konten file
	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca file"})
		return
	}

	// Panggil Service
	service := GetAIService()
	analysis, err := service.AnalyzeProposal(header.Filename, string(content))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"fileName": header.Filename,
		"analysis": analysis,
	})
}
