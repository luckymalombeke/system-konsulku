package handlers

import (
	"fmt"
	"strings"
	"time"
	"konsulku/config"
	"konsulku/models"
	"konsulku/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var apptService = services.NewAppointmentService()

func HandleCreateAppointment(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	if role != "mahasiswa" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya mahasiswa yang bisa membuat janji"})
		return
	}

	var mhs models.Mahasiswa
	if err := config.DB.Where("user_id = ?", userID).First(&mhs).Error; err != nil {
		c.JSON(400, gin.H{"error": "Mahasiswa tidak ditemukan"})
		return
	}

	dosenIDStr := c.PostForm("dosen_id")
	dosenID, _ := strconv.Atoi(dosenIDStr)
	topik := c.PostForm("topik")
	deskripsi := c.PostForm("deskripsi")
	tanggalRequest := c.PostForm("tanggal_request")
	jamRequest := c.PostForm("jam_request")
	jenis := c.PostForm("jenis")
	status := c.PostForm("status")
	if status == "" {
		status = "Menunggu"
	}

	// Handle file upload
	var lampiranURL *string
	file, err := c.FormFile("lampiran")
	if err == nil { // Jika ada file yang diunggah
		safeFilename := strings.ReplaceAll(file.Filename, " ", "_")
		safeFilename = strings.ReplaceAll(safeFilename, "#", "")
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeFilename)
		filepath := "./uploads/" + filename
		if err := c.SaveUploadedFile(file, filepath); err == nil {
			url := "/uploads/" + filename
			lampiranURL = &url
		}
	}

	input := models.Appointment{
		MahasiswaID:    mhs.ID,
		DosenID:        uint(dosenID),
		Topik:          topik,
		Deskripsi:      deskripsi,
		TanggalRequest: tanggalRequest,
		JamRequest:     jamRequest,
		Jenis:          jenis,
		Status:         status,
		LampiranURL:    lampiranURL,
	}
	if err := apptService.CreateBooking(&input); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// CONTOH GOROUTINE: Mengirim notifikasi / email di background
	// Proses ini tidak akan memblokir HTTP response ke user
	go func(dosenID uint, topik string) {
		fmt.Println("[Background Task] Mulai menyiapkan email notifikasi ke Dosen...")
		time.Sleep(3 * time.Second) // Simulasi delay kirim email (3 detik)
		fmt.Printf("[Background Task] ✅ Notifikasi email untuk topik '%s' berhasil dikirim ke Dosen ID %d!\n", topik, dosenID)
	}(input.DosenID, input.Topik)

	c.JSON(201, gin.H{"message": "Berhasil membuat janji", "data": input})
}

func HandleGetAppointments(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	appts, err := apptService.GetAppointmentsByIDAndRole(userID, role)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, appts)
}

func HandleGetAppointmentByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID tidak valid"})
		return
	}

	appt, err := apptService.GetByID(uint(id))
	if err != nil {
		c.JSON(404, gin.H{"error": "Appointment tidak ditemukan"})
		return
	}

	c.JSON(200, appt)
}
