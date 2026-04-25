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

	if err := chatService.SendMessage(userID, role, input.TargetUserID, input.Teks); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": "Pesan terkirim"})
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
