package handlers

import (
	"fmt"
	"konsulku/config"
	"konsulku/models"
	"net/http"
	"strings"
	"time"

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

	// Paksa parse multipart form jika kontennya adalah multipart
	c.Request.ParseMultipartForm(32 << 20) // 32MB max memory

	contentType := c.GetHeader("Content-Type")
	isMultipart := strings.Contains(contentType, "multipart/form-data")

	var fotoProfilURL *string
	file, err := c.FormFile("foto_profil")
	if err == nil {
		safeFilename := strings.ReplaceAll(file.Filename, " ", "_")
		filename := fmt.Sprintf("profile_%d_%s", time.Now().UnixNano(), safeFilename)
		filepath := "./uploads/" + filename
		if errSave := c.SaveUploadedFile(file, filepath); errSave == nil {
			url := "/uploads/" + filename
			fotoProfilURL = &url
			fmt.Println("DEBUG: Berhasil menyimpan foto ke", filepath)
		} else {
			fmt.Println("DEBUG: Gagal simpan file:", errSave)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan foto profil ke server: " + errSave.Error()})
			return
		}
	} else if isMultipart {
		fmt.Println("DEBUG: Tidak ada file 'foto_profil' ditemukan di form")
	}

	if role == "mahasiswa" {
		updates := make(map[string]interface{})
		if isMultipart {
			updates["nama_lengkap"] = c.PostForm("nama_lengkap")
			updates["nim"] = c.PostForm("nim")
			updates["semester"] = c.PostForm("semester")
			updates["prodi"] = c.PostForm("prodi")
			updates["bio"] = c.PostForm("bio")
			updates["pengalaman"] = c.PostForm("pengalaman")
		} else {
			var input struct {
				NamaLengkap string `json:"nama_lengkap"`
				Nim         string `json:"nim"`
				Semester    int    `json:"semester"`
				Prodi       string `json:"prodi"`
				Bio         string `json:"bio"`
				Pengalaman  string `json:"pengalaman"`
			}
			if err := c.ShouldBindJSON(&input); err == nil {
				updates["nama_lengkap"] = input.NamaLengkap
				updates["nim"] = input.Nim
				updates["semester"] = input.Semester
				updates["prodi"] = input.Prodi
				updates["bio"] = input.Bio
				updates["pengalaman"] = input.Pengalaman
			}
		}

		if fotoProfilURL != nil {
			updates["foto_profil"] = *fotoProfilURL
		}

		if err := config.DB.Model(&models.Mahasiswa{}).Where("user_id = ?", userID).Updates(updates).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal update profil"})
			return
		}
		c.JSON(200, gin.H{"message": "Profil berhasil diperbarui", "foto_profil": fotoProfilURL})
	} else {
		updates := make(map[string]interface{})
		if isMultipart {
			updates["nama_lengkap"] = c.PostForm("nama_lengkap")
			updates["nip"] = c.PostForm("nip")
			updates["gelar_belakang"] = c.PostForm("gelar_belakang")
			updates["jabatan"] = c.PostForm("jabatan")
			updates["prodi"] = c.PostForm("prodi")
			updates["bio"] = c.PostForm("bio")
			updates["pengalaman"] = c.PostForm("pengalaman")
			updates["catatan_jadwal"] = c.PostForm("catatan_jadwal")
			if avail := c.PostForm("is_available"); avail != "" {
				updates["is_available"] = avail == "true"
			}
		} else {
			var input struct {
				NamaLengkap   string `json:"nama_lengkap"`
				Nip           string `json:"nip"`
				GelarBelakang string `json:"gelar_belakang"`
				Jabatan       string `json:"jabatan"`
				Prodi         string `json:"prodi"`
				Bio         string `json:"bio"`
				Pengalaman    string `json:"pengalaman"`
				IsAvailable   *bool  `json:"is_available"`
				CatatanJadwal string `json:"catatan_jadwal"`
			}
			if err := c.ShouldBindJSON(&input); err == nil {
				updates["nama_lengkap"] = input.NamaLengkap
				updates["nip"] = input.Nip
				updates["gelar_belakang"] = input.GelarBelakang
				updates["jabatan"] = input.Jabatan
				updates["prodi"] = input.Prodi
				updates["bio"] = input.Bio
				updates["pengalaman"] = input.Pengalaman
				updates["catatan_jadwal"] = input.CatatanJadwal
				if input.IsAvailable != nil {
					updates["is_available"] = *input.IsAvailable
				}
			}
		}

		if fotoProfilURL != nil {
			updates["foto_profil"] = *fotoProfilURL
		}

		if err := config.DB.Model(&models.Dosen{}).Where("user_id = ?", userID).Updates(updates).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal update profil"})
			return
		}
		c.JSON(200, gin.H{"message": "Profil berhasil diperbarui", "foto_profil": fotoProfilURL})
	}
}
