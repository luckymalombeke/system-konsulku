package handlers

import (
	"konsulku/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Di produksi sebaiknya dibatasi ke domain frontend Anda
	},
}

func HandleWebSocket(c *gin.Context) {
	// Ambil userID dari context (diisi oleh AuthMiddleware)
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := uint(userIDVal.(float64))

	// Upgrade HTTP connection ke WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	// Register client ke manager
	utils.Manager.Register(userID, conn)

	// Jaga koneksi tetap terbuka (Read Loop)
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			// Jika koneksi putus (user close tab/logout), unregister
			utils.Manager.Unregister(userID)
			break
		}
	}
}
