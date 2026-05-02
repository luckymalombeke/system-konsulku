package models

import "time"

type KonsultasiChat struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	MahasiswaID uint      `json:"mahasiswa_id"`
	Mahasiswa   Mahasiswa `gorm:"foreignKey:MahasiswaID" json:"mahasiswa"`
	DosenID     uint      `json:"dosen_id"`
	Dosen       Dosen     `gorm:"foreignKey:DosenID" json:"dosen"`
	DibuatPada  time.Time `gorm:"autoCreateTime" json:"dibuat_pada"`
}

func (KonsultasiChat) TableName() string {
	return "konsultasi_chat"
}

type Pesan struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	ChatID     uint           `json:"chat_id"`
	Chat       KonsultasiChat `gorm:"foreignKey:ChatID" json:"chat"`
	PengirimID uint           `json:"pengirim_id"`
	Pengirim   User           `gorm:"foreignKey:PengirimID" json:"pengirim"`
	Teks       string         `json:"teks"`
	IsFile     bool           `json:"is_file"`
	Dibaca     bool           `json:"dibaca"`
	Diedit     bool           `json:"diedit" gorm:"default:false"`
	Dihapus    bool           `json:"dihapus" gorm:"default:false"`
	DikirimAt  time.Time      `gorm:"autoCreateTime" json:"dikirim_at"`
}

func (Pesan) TableName() string {
	return "pesan"
}
