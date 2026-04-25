package models

type User struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Username  string `gorm:"unique" json:"username" binding:"required,min=4"`
	Password  string `json:"password,omitempty" binding:"required,min=6"`
	Role      string `json:"role" binding:"required,oneof=dosen mahasiswa"`
	Email     string `json:"email" binding:"required,email"`
	IsActive  bool   `json:"is_active"`
}

type Dosen struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	UserID        uint   `json:"user_id"`
	User          User   `gorm:"foreignKey:UserID" json:"user"`
	Nip           string `json:"nip"`
	NamaLengkap   string `json:"nama_lengkap"`
	GelarBelakang string `json:"gelar_belakang"`
	Jabatan       string `json:"jabatan"`
	Bio           string `json:"bio"`
	Pengalaman    string `json:"pengalaman"`
	Prodi         string `json:"prodi"`
	IsAvailable   bool   `json:"is_available"`
}

type Mahasiswa struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	UserID      uint   `json:"user_id"`
	User        User   `gorm:"foreignKey:UserID" json:"user"`
	Nim         string `json:"nim"`
	NamaLengkap string `json:"nama_lengkap"`
	Semester    int    `json:"semester"`
	Angkatan    int    `json:"angkatan"`
	Bio         string `json:"bio"`
	Pengalaman  string `json:"pengalaman"`
	Prodi       string `json:"prodi"`
}

func (Dosen) TableName() string {
	return "dosen"
}

func (Mahasiswa) TableName() string {
	return "mahasiswa"
}
