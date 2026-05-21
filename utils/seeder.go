package utils

import (
	"konsulku/config"
	"konsulku/models"
	"golang.org/x/crypto/bcrypt"
	"fmt"
)

func SeedData() {
	fmt.Println("[Seeder] 🔍 Mengecek data...")

	// 1. Hapus janji temu (appointment) yang terhubung ke dosen yang tidak valid
	config.DB.Exec(`
		DELETE FROM appointment 
		WHERE dosen_id IN (SELECT id FROM dosen WHERE nip IS NULL OR nip = '' OR TRIM(nip) = '')
	`)

	// 2. Hapus notifikasi yang terhubung ke user id dosen hantu
	config.DB.Exec(`
		DELETE FROM notifikasi 
		WHERE user_id IN (SELECT user_id FROM dosen WHERE nip IS NULL OR nip = '' OR TRIM(nip) = '')
	`)

	// 3. Hapus pesan yang terhubung ke chat dosen hantu
	config.DB.Exec(`
		DELETE FROM pesan 
		WHERE chat_id IN (SELECT id FROM konsultasi_chat WHERE dosen_id IN (SELECT id FROM dosen WHERE nip IS NULL OR nip = '' OR TRIM(nip) = ''))
	`)

	// 4. Hapus sesi chat (konsultasi_chat) dosen hantu
	config.DB.Exec(`
		DELETE FROM konsultasi_chat 
		WHERE dosen_id IN (SELECT id FROM dosen WHERE nip IS NULL OR nip = '' OR TRIM(nip) = '')
	`)

	// 5. Akhirnya hapus dosen yang tidak valid
	config.DB.Exec("DELETE FROM dosen WHERE nip IS NULL OR nip = '' OR TRIM(nip) = '' OR nama_lengkap = 'Dosen Baru (Belum Diatur)'")
	
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// 1. Pastikan Akun Mahasiswa (Lucky) ada
	var mhsUser models.User
	result := config.DB.Where("username = ?", "20010101").First(&mhsUser)
	if result.Error != nil {
		fmt.Println("Akun Mahasiswa 20010101 belum ada, sedang dibuat...")
		userMhs := models.User{
			Username: "20010101",
			Password: string(hashedPassword),
			Email:    "lucky@student.university.ac.id",
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
	dosenData := []struct {
		Nama  string
		Nip   string
		Prodi string
		Gelar string
		Jadwal string
	}{
		{"Stenly R. Pungus", "19800101", "Sistem Informasi", "PhD", "Senin - Kamis (09:00 - 15:00)"},
		{"Semmy Taju", "19810202", "Teknik Informatika", "PhD", "Selasa & Jumat (10:00 - 16:00)"},
	}

	for _, d := range dosenData {
		var existingDosen models.Dosen
		resultDosen := config.DB.Where("nip = ?", d.Nip).First(&existingDosen)
		
		if resultDosen.Error != nil {
			fmt.Printf("[Seeder] 📋 Data Dosen %s belum ada, membuat baru...\n", d.Nama)
			
			// 1. Cari apakah User sudah ada
			var user models.User
			errUser := config.DB.Where("username = ?", d.Nip).First(&user).Error
			
			if errUser != nil {
				user = models.User{
					Username: d.Nip,
					Password: string(hashedPassword),
					Email:    d.Nip + "@university.ac.id",
					Role:     "dosen",
					IsActive: true,
				}
				config.DB.Create(&user)
			}

			// 2. Buat Dosen
			dosen := models.Dosen{
				UserID:        user.ID,
				Nip:           d.Nip,
				NamaLengkap:   d.Nama,
				GelarBelakang: d.Gelar,
				Prodi:         d.Prodi,
				IsAvailable:   true,
				CatatanJadwal: d.Jadwal,
			}
			config.DB.Create(&dosen)
		}
	}

	// Tampilkan daftar dosen yang sekarang ada di DB
	var listDosen []models.Dosen
	config.DB.Select("id, nama_lengkap, nip").Find(&listDosen)
	fmt.Println("[Seeder] 📋 Daftar Dosen Aktif di DB:")
	for _, ld := range listDosen {
		fmt.Printf("   - %s (NIP: %s)\n", ld.NamaLengkap, ld.Nip)
	}

	// 3. Seed DosenAvailability (Jadwal Ketersediaan)
	fmt.Println("[Seeder] 📅 Membuat jadwal ketersediaan dosen...")
	availabilityData := []struct {
		DosenID   uint
		DayOfWeek int
		DayName   string
		StartTime string
		EndTime   string
	}{
		// Dosen 1: Senin - Kamis 09:00 - 15:00
		{1, 1, "Senin", "09:00", "15:00"},
		{1, 2, "Selasa", "09:00", "15:00"},
		{1, 3, "Rabu", "09:00", "15:00"},
		{1, 4, "Kamis", "09:00", "15:00"},
		// Dosen 2: Selasa & Jumat 10:00 - 16:00
		{2, 2, "Selasa", "10:00", "16:00"},
		{2, 5, "Jumat", "10:00", "16:00"},
	}

	for _, av := range availabilityData {
		var existingAv models.DosenAvailability
		if err := config.DB.Where("dosen_id = ? AND day_of_week = ?", av.DosenID, av.DayOfWeek).First(&existingAv).Error; err != nil {
			availability := models.DosenAvailability{
				DosenID:   av.DosenID,
				DayOfWeek: av.DayOfWeek,
				DayName:   av.DayName,
				StartTime: av.StartTime,
				EndTime:   av.EndTime,
				IsActive:  true,
			}
			config.DB.Create(&availability)
			fmt.Printf("   ✅ Jadwal ketersediaan dibuat: Dosen ID %d, %s %s-%s\n", av.DosenID, av.DayName, av.StartTime, av.EndTime)
		}
	}

	fmt.Println("[Seeder] ✅ Jadwal ketersediaan dosen selesai!")

	fmt.Println("✅ Sinkronisasi data dummy selesai!")
	fmt.Println("Silakan login dengan Username: 20010101 dan Password: password123")
}
