package handlers

import (
	"konsulku/config"
	"konsulku/models"

	"github.com/gin-gonic/gin"
)

func HandleProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(float64)
	role := c.MustGet("role").(string)
	if role == "mahasiswa" {
		var mhs models.Mahasiswa
		config.DB.Preload("User").Where("user_id = ?", userID).First(&mhs)
		c.JSON(200, mhs)
	} else {
		var dsn models.Dosen
		config.DB.Preload("User").Where("user_id = ?", userID).First(&dsn)
		c.JSON(200, dsn)
	}
}

func HandleUpdateProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(float64)
	role := c.MustGet("role").(string)

	if role == "mahasiswa" {
		var input struct {
			NamaLengkap string `json:"nama_lengkap"`
			Nim         string `json:"nim"`
			Semester    int    `json:"semester"`
			Prodi       string `json:"prodi"`
			Bio         string `json:"bio"`
			Pengalaman  string `json:"pengalaman"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if err := config.DB.Model(&models.Mahasiswa{}).Where("user_id = ?", userID).Updates(input).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal update profil"})
			return
		}
		c.JSON(200, gin.H{"message": "Profil berhasil diperbarui"})
	} else {
		var input struct {
			NamaLengkap   string `json:"nama_lengkap"`
			Nip           string `json:"nip"`
			GelarBelakang string `json:"gelar_belakang"`
			Jabatan       string `json:"jabatan"`
			Prodi         string `json:"prodi"`
			Bio           string `json:"bio"`
			Pengalaman    string `json:"pengalaman"`
			IsAvailable   *bool  `json:"is_available"`
			CatatanJadwal string `json:"catatan_jadwal"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if err := config.DB.Model(&models.Dosen{}).Where("user_id = ?", userID).Updates(input).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal update profil"})
			return
		}
		c.JSON(200, gin.H{"message": "Profil berhasil diperbarui"})
	}
}
