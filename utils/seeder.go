package utils

import (
	"konsulku/config"
	"konsulku/models"
	"golang.org/x/crypto/bcrypt"
	"fmt"
)

func SeedData() {
	fmt.Println("Mengecek ketersediaan data dummy...")

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// 1. Pastikan Akun Mahasiswa (Lucky) ada
	var mhsUser models.User
	result := config.DB.Where("username = ?", "20010101").First(&mhsUser)
	if result.Error != nil {
		fmt.Println("Akun Mahasiswa 20010101 belum ada, sedang dibuat...")
		userMhs := models.User{
			Username: "20010101",
			Password: string(hashedPassword),
			Email:    "lucky@student.unklab.ac.id",
			Role:     "mahasiswa",
			IsActive: true,
		}
		config.DB.Create(&userMhs)

		mhs := models.Mahasiswa{
			UserID:      userMhs.ID,
			NamaLengkap: "Lucky Malombeke",
			Nim:         "20010101",
			Prodi:       "Sistem Informasi",
			Semester:    6,
			Angkatan:    2021,
		}
		config.DB.Create(&mhs)
	}

	// 2. Pastikan minimal ada 1 Dosen
	var dosenUser models.User
	resultDosen := config.DB.Where("role = ?", "dosen").First(&dosenUser)
	if resultDosen.Error != nil {
		fmt.Println("Data Dosen kosong, sedang mengisi data Dosen...")
		dosenData := []struct {
			Nama  string
			Nip   string
			Prodi string
		}{
			{"Stenly R. Pungus, PhD", "19800101", "Sistem Informasi"},
			{"Semmy Taju, PhD", "19810202", "Teknik Informatika"},
		}

		for _, d := range dosenData {
			user := models.User{
				Username: d.Nip,
				Password: string(hashedPassword),
				Email:    d.Nip + "@unklab.ac.id",
				Role:     "dosen",
				IsActive: true,
			}
			config.DB.Create(&user)

			dosen := models.Dosen{
				UserID:      user.ID,
				Nip:         d.Nip,
				NamaLengkap: d.Nama,
				Prodi:       d.Prodi,
				IsAvailable: true,
			}
			config.DB.Create(&dosen)
		}
	}

	fmt.Println("✅ Sinkronisasi data dummy selesai!")
	fmt.Println("Silakan login dengan Username: 20010101 dan Password: password123")
}
