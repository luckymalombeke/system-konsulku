package handlers

import (
	"konsulku/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var notifService = services.NewNotificationService()

func HandleRejectAppointment(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	if role != "dosen" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya dosen yang bisa menolak janji"})
		return
	}

	apptIDStr := c.Param("id")
	apptID, err := strconv.Atoi(apptIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var input struct {
		Alasan string `json:"alasan"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := notifService.RejectAppointment(uint(apptID), userID, input.Alasan); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Appointment berhasil ditolak"})
}

func HandleGetNotifications(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))

	notifs, err := notifService.GetMyNotifications(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, notifs)
}

func HandleCancelAppointment(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	if role != "mahasiswa" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya mahasiswa yang bisa membatalkan janji"})
		return
	}

	apptIDStr := c.Param("id")
	apptID, err := strconv.Atoi(apptIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var input struct {
		Alasan string `json:"alasan"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := notifService.CancelAppointment(uint(apptID), userID, input.Alasan); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Appointment berhasil dibatalkan"})
}
