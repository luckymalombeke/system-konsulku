package handlers

import (
	"konsulku/models"
	"konsulku/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

var authService = services.NewAuthService()

func HandleLogin(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username, password, dan role wajib diisi"})
		return
	}

	token, user, err := authService.Login(input.Username, input.Password, input.Role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func HandleRegister(c *gin.Context) {
	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data registrasi tidak valid atau kurang lengkap", "detail": err.Error()})
		return
	}

	if err := authService.Register(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan user", "detail": err.Error()})
		return
	}

	input.Password = "" // Jangan kembalikan password
	c.JSON(http.StatusCreated, gin.H{
		"message": "Berhasil daftar! Silakan login.",
		"data":    input,
	})
}

func HandleGetAllDosen(c *gin.Context) {
	dosens, err := authService.GetAllDosen()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar dosen"})
		return
	}
	c.JSON(http.StatusOK, dosens)
}
