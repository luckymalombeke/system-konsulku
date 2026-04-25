package handlers

import (
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
