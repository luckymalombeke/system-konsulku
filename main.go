package main

import (
	"fmt"
	"konsulku/config"
	"konsulku/handlers"
	"konsulku/middlewares"
	"konsulku/models"
	"konsulku/utils"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load .env file jika ada (biasanya di local development)
	// Di production (Render/Railway), kita set env variables di dashboard mereka
	_ = godotenv.Load()

	// Setup Logrus
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.InfoLevel)
	logrus.Info("Starting KonsulKu Backend Application...")


	config.ConnectDatabase()

	// AutoMigrate: otomatis tambahkan kolom/tabel yang belum ada di database
	fmt.Println("Sedang menyelaraskan database...")
	errMigrate := config.DB.AutoMigrate(&models.User{}, &models.Dosen{}, &models.Mahasiswa{}, &models.Appointment{}, &models.Notifikasi{}, &models.KonsultasiChat{}, &models.Pesan{})
	if errMigrate != nil {
		fmt.Println("Gagal migrasi database:", errMigrate)
	} else {
		fmt.Println("Database berhasil diselaraskan!")
	}

	// Isi data dummy jika database kosong
	utils.SeedData()

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())
	r.Static("/uploads", "./uploads")

	r.POST("/login", handlers.HandleLogin)
	r.POST("/register", handlers.HandleRegister)

	authorized := r.Group("/api")
	authorized.Use(middlewares.AuthMiddleware())
	{
		// Profile
		authorized.GET("/profile", handlers.HandleProfile)
		authorized.PUT("/profile", handlers.HandleUpdateProfile)
		authorized.GET("/dosen", handlers.HandleGetAllDosen)
		
		// Appointment
		authorized.POST("/appointment", handlers.HandleCreateAppointment)
		authorized.GET("/appointment", handlers.HandleGetAppointments)
		authorized.GET("/appointment/:id", handlers.HandleGetAppointmentByID)
		authorized.PUT("/appointment/:id/reject", handlers.HandleRejectAppointment)
		authorized.PUT("/appointment/:id/cancel", handlers.HandleCancelAppointment)
		authorized.PUT("/appointment/:id/accept", handlers.HandleAcceptAppointment)
		authorized.PUT("/appointment/:id/complete", handlers.HandleCompleteAppointment)
		
		// Chat
		authorized.GET("/chat-contacts", handlers.HandleGetChatContacts)
		authorized.POST("/chat", handlers.HandleSendMessage)
		authorized.GET("/chat/:target_id", handlers.HandleGetMessages)
		authorized.PUT("/chat/:message_id", handlers.HandleEditMessage)
		authorized.DELETE("/chat/:message_id", handlers.HandleDeleteMessage)
		
		// Notification
		authorized.GET("/notification", handlers.HandleGetNotifications)
		authorized.PUT("/notification/read", handlers.HandleMarkNotificationsAsRead)

		// Stats
		authorized.GET("/stats/dosen", handlers.HandleGetDosenStats)

		// AI Assistant
		authorized.POST("/ai/advice", handlers.HandleAIAdvice)
		authorized.POST("/ai/chat", handlers.HandleSmartAssistant)
		authorized.POST("/ai/analyze-proposal", handlers.HandleProposalAnalysis)
		authorized.POST("/ai/chat-proposal", handlers.HandleChatWithProposal)

		// WebSocket
		authorized.GET("/ws", handlers.HandleWebSocket)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("Server KonsulKu Jalan di :%s\n", port)
	err := r.Run(":" + port)
	if err != nil {
		fmt.Println("SERVER ERROR KELUAR:", err)
	}
}
