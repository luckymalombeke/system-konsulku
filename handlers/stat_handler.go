package handlers

import (
	"fmt"
	"konsulku/config"
	"konsulku/models"

	"github.com/gin-gonic/gin"
)

type StatCard struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type MonthlyStat struct {
	Month string `json:"month"`
	Total int64  `json:"total"`
}

type TypeStat struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type StudentRank struct {
	Name    string `json:"name"`
	Nim     string `json:"nim"`
	Prodi   string `json:"prodi"`
	Online  int64  `json:"online"`
	Offline int64  `json:"offline"`
	Total   int64  `json:"total"`
}

func HandleGetDosenStats(c *gin.Context) {
	userID := uint(c.MustGet("user_id").(float64))
	
	var dosen models.Dosen
	if err := config.DB.Where("user_id = ?", userID).First(&dosen).Error; err != nil {
		c.JSON(404, gin.H{"error": "Dosen tidak ditemukan"})
		return
	}

	// 1. Total Mahasiswa Unik
	var totalMahasiswa int64
	config.DB.Model(&models.Appointment{}).Where("dosen_id = ?", dosen.ID).Distinct("mahasiswa_id").Count(&totalMahasiswa)

	// 2. Total Konsultasi
	var totalKonsultasi int64
	config.DB.Model(&models.Appointment{}).Where("dosen_id = ?", dosen.ID).Count(&totalKonsultasi)

	// 3. Rata-rata (Manual Calculation)
	avg := 0.0
	if totalMahasiswa > 0 {
		avg = float64(totalKonsultasi) / float64(totalMahasiswa)
	}

	// 4. Tingkat Respons (Accepted + Rejected + Selesai) / Total
	var responded int64
	config.DB.Model(&models.Appointment{}).Where("dosen_id = ? AND status != ?", dosen.ID, "Menunggu").Count(&responded)
	responseRate := 0
	if totalKonsultasi > 0 {
		responseRate = int((float64(responded) / float64(totalKonsultasi)) * 100)
	}

	// 5. Tren Bulanan (Sederhana: Ambil semua lalu group di memori atau SQL)
	var monthlyResults []struct {
		Month string
		Total int64
	}
	// Note: Format tanggal di database adalah string "YYYY-MM-DD"
	config.DB.Raw("SELECT SUBSTR(tanggal_request, 1, 7) as month, COUNT(*) as total FROM appointment WHERE dosen_id = ? GROUP BY month ORDER BY month DESC LIMIT 12", dosen.ID).Scan(&monthlyResults)

	// 6. Rasio Online vs Offline
	var onlineCount int64
	var offlineCount int64
	config.DB.Model(&models.Appointment{}).Where("dosen_id = ? AND jenis = ?", dosen.ID, "Online").Count(&onlineCount)
	config.DB.Model(&models.Appointment{}).Where("dosen_id = ? AND jenis = ?", dosen.ID, "Offline").Count(&offlineCount)

	// 7. Peringkat Mahasiswa
	var rankings []StudentRank
	config.DB.Raw(`
		SELECT m.nama_lengkap as name, m.nim, m.prodi,
		SUM(CASE WHEN a.jenis = 'Online' THEN 1 ELSE 0 END) as online,
		SUM(CASE WHEN a.jenis = 'Offline' THEN 1 ELSE 0 END) as offline,
		COUNT(a.id) as total
		FROM mahasiswa m
		JOIN appointment a ON m.id = a.mahasiswa_id
		WHERE a.dosen_id = ?
		GROUP BY m.id
		ORDER BY total DESC
		LIMIT 10
	`, dosen.ID).Scan(&rankings)

	c.JSON(200, gin.H{
		"total_mahasiswa":  totalMahasiswa,
		"total_konsultasi": totalKonsultasi,
		"avg_per_mhs":      fmt.Sprintf("%.1f", avg),
		"response_rate":    fmt.Sprintf("%d%%", responseRate),
		"monthly_data":     monthlyResults,
		"pie_data": []TypeStat{
			{Name: "Online", Value: onlineCount},
			{Name: "Offline", Value: offlineCount},
		},
		"rankings": rankings,
	})
}
