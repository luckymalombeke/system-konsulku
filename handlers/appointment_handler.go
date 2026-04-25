package handlers

import (
	"fmt"
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

	var input models.Appointment
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	input.MahasiswaID = mhs.ID
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
