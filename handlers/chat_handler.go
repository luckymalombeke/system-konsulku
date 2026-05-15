package handlers

import (
	"konsulku/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

var chatService = services.NewChatService()

func HandleSendMessage(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	var input struct {
		TargetUserID uint   `json:"target_user_id"`
		Teks         string `json:"teks"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	pesan, err := chatService.SendMessage(userID, role, input.TargetUserID, input.Teks)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": "Pesan terkirim", "data": pesan})
}

func HandleGetMessages(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	targetIDStr := c.Param("target_id")
	targetID, err := strconv.Atoi(targetIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid target_id"})
		return
	}

	messages, err := chatService.GetMessages(userID, role, uint(targetID))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, messages)
}

func HandleEditMessage(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	messageIDStr := c.Param("message_id")
	messageID, err := strconv.Atoi(messageIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid message_id"})
		return
	}

	var input struct {
		Teks string `json:"teks"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := chatService.EditMessage(userID, uint(messageID), input.Teks); err != nil {
		c.JSON(403, gin.H{"error": err.Error()})
		return
	}

	// Ambil data target_user_id dari pesan untuk broadcast (opsional, tapi bagus buat real-time)
	// Untuk sederhananya kita broadcast ID pesan saja
	// (Idealnya ambil target_id dari DB, tapi di sini kita pakai data minimal)
	
	c.JSON(200, gin.H{"message": "Pesan berhasil diedit"})
}

func HandleDeleteMessage(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	messageIDStr := c.Param("message_id")
	messageID, err := strconv.Atoi(messageIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid message_id"})
		return
	}

	if err := chatService.DeleteMessage(userID, uint(messageID)); err != nil {
		c.JSON(403, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Pesan berhasil dihapus"})
}

func HandleGetChatContacts(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	role := c.MustGet("role").(string)

	contacts, err := chatService.GetChatContacts(userID, role)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, contacts)
}
