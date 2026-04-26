package services

import (
	"errors"
	"konsulku/config"
	"konsulku/models"
	"konsulku/repositories"
	"konsulku/utils"
)

type AuthService interface {
	Register(user *models.User) error
	Login(username, password, role string) (string, map[string]interface{}, error)
	GetAllDosen() ([]models.Dosen, error)
}

func (s *authService) GetAllDosen() ([]models.Dosen, error) {
	return s.userRepo.GetAllDosen()
}

type authService struct {
	userRepo repositories.UserRepository
}

func NewAuthService() AuthService {
	return &authService{
		userRepo: repositories.NewUserRepository(),
	}
}

func (s *authService) Register(user *models.User) error {
	hashed, err := utils.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashed
	
	// Gunakan transaksi database agar jika salah satu gagal, semua dibatalkan
	tx := config.DB.Begin()
	
	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Buat data detail berdasarkan role
	if user.Role == "dosen" {
		dosen := models.Dosen{
			UserID:      user.ID,
			NamaLengkap: "Dosen Baru (Belum Diatur)", // Default nama
			Nip:         user.Username,               // Username biasanya NIP
		}
		if err := tx.Create(&dosen).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else {
		mhs := models.Mahasiswa{
			UserID:      user.ID,
			NamaLengkap: "Mahasiswa Baru (Belum Diatur)", // Default nama
			Nim:         user.Username,                   // Username biasanya NIM
		}
		if err := tx.Create(&mhs).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (s *authService) Login(username, password, role string) (string, map[string]interface{}, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return "", nil, errors.New("user tidak ditemukan")
	}

	if !utils.CheckPasswordHash(password, user.Password) {
		return "", nil, errors.New("password salah")
	}

	// Verifikasi apakah role yang dipilih sesuai dengan role di database
	if user.Role != role {
		msg := "Akun Anda terdaftar sebagai mahasiswa, silakan login di portal mahasiswa"
		if user.Role == "dosen" {
			msg = "Akun Anda terdaftar sebagai dosen, silakan login di portal dosen"
		}
		return "", nil, errors.New(msg)
	}

	var detail map[string]interface{}
	if user.Role == "dosen" {
		detail, _ = s.userRepo.GetDosenByUserID(user.ID)
	} else if user.Role == "mahasiswa" {
		detail, _ = s.userRepo.GetMahasiswaByUserID(user.ID)
	}

	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		return "", nil, err
	}

	userData := map[string]interface{}{
		"id":           user.ID,
		"username":     user.Username,
		"role":         user.Role,
		"nama_lengkap": detail["nama_lengkap"],
		"no_induk":     detail["no_induk"],
	}

	return token, userData, nil
}
