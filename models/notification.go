package models

import "time"

type Notifikasi struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"user"`
	Judul       string    `json:"judul"`
	Pesan       string    `json:"pesan"`
	Tipe        string    `json:"tipe"`
	ReferensiID uint      `json:"referensi_id"`
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}

func (Notifikasi) TableName() string {
	return "notifikasi"
}
