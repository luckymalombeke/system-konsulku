package models

type Appointment struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	MahasiswaID        uint      `json:"mahasiswa_id"`
	Mahasiswa          Mahasiswa `gorm:"foreignKey:MahasiswaID" json:"mahasiswa"`
	DosenID            uint      `json:"dosen_id"`
	Dosen              Dosen     `gorm:"foreignKey:DosenID" json:"dosen"`
	Topik              string    `json:"topik"`
	Deskripsi          string    `json:"deskripsi"`
	TanggalRequest     string    `json:"tanggal_request"`
	JamRequest         string    `json:"jam_request"`
	Jenis              string    `json:"jenis"`
	Status             string    `json:"status"`
	LampiranURL        *string   `json:"lampiran_url"`
	RescheduleTanggal  *string   `json:"reschedule_tanggal"`
	RescheduleJam      *string   `json:"reschedule_jam"`
	RescheduleCatatan  *string   `json:"reschedule_catatan"`
	AlasanPenolakan    *string   `json:"alasan_penolakan"`
	CatatanHasil       *string   `json:"catatan_hasil"`
}

func (Appointment) TableName() string {
	return "appointment"
}
