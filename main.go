package main

import (
	"fmt"
	"konsulku/config"
	"konsulku/handlers"
	"konsulku/middlewares"
	"konsulku/models"
	"konsulku/utils"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Setup Logrus
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.InfoLevel)
	logrus.Info("Starting KonsulKu Backend Application...")


	config.ConnectDatabase()

	// AutoMigrate: otomatis tambahkan kolom/tabel yang belum ada di database
	fmt.Println("Sedang menyelaraskan database...")
	errMigrate := config.DB.AutoMigrate(&models.User{}, &models.Dosen{}, &models.Mahasiswa{}, &models.Appointment{})
	if errMigrate != nil {
		fmt.Println("Gagal migrasi database:", errMigrate)
	} else {
		fmt.Println("Database berhasil diselaraskan!")
	}

	// Isi data dummy jika database kosong
	utils.SeedData()

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

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
		
		// Chat
		authorized.POST("/chat", handlers.HandleSendMessage)
		authorized.GET("/chat/:target_id", handlers.HandleGetMessages)
		
		// Notification
		authorized.GET("/notification", handlers.HandleGetNotifications)

		// AI Assistant
		authorized.POST("/ai/advice", handlers.HandleAIAdvice)

		// WebSocket
		authorized.GET("/ws", handlers.HandleWebSocket)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("Server KonsulKu Jalan di :%s\n", port)
	r.Run(":" + port)
}
