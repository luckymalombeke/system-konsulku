package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	// Supabase biasanya memberikan Connection String lengkap (DATABASE_URL)
	dsn := os.Getenv("DATABASE_URL")
	
	if dsn != "" {
		fmt.Println("📍 Menggunakan koneksi DATABASE_URL (Supabase/Production)")
	} else {
		fmt.Println("⚠️  DATABASE_URL tidak ditemukan, menggunakan fallback ke individual variables...")
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbUser := os.Getenv("DB_USER")
		dbPass := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		
		if dbHost == "" { dbHost = "127.0.0.1" }
		if dbPort == "" { dbPort = "5432" }
		
		// Format DSN PostgreSQL
		dsn = "host=" + dbHost + " user=" + dbUser + " password=" + dbPass + " dbname=" + dbName + " port=" + dbPort + " sslmode=disable"
		fmt.Printf("📍 Menghubungkan ke %s:%s...\n", dbHost, dbPort)
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Gagal koneksi ke database:", err)
	}
	fmt.Println("✅ Berhasil terhubung ke database!")
}
