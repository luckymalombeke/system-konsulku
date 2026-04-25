package repositories

import (
	"konsulku/config"
	"konsulku/models"
)

type UserRepository interface {
	Create(user *models.User) error
	FindByUsername(username string) (*models.User, error)
	GetDosenByUserID(userID uint) (map[string]interface{}, error)
	GetMahasiswaByUserID(userID uint) (map[string]interface{}, error)
	GetAllDosen() ([]models.Dosen, error)
	FindMahasiswaByUserID(userID uint) (*models.Mahasiswa, error)
	FindDosenByUserID(userID uint) (*models.Dosen, error)
	FindMahasiswaByID(id uint) (*models.Mahasiswa, error)
	FindDosenByID(id uint) (*models.Dosen, error)
}

func (r *userRepository) GetAllDosen() ([]models.Dosen, error) {
	var dosens []models.Dosen
	err := config.DB.Find(&dosens).Error
	return dosens, err
}

type userRepository struct{}

func NewUserRepository() UserRepository {
	return &userRepository{}
}

func (r *userRepository) Create(user *models.User) error {
	return config.DB.Create(user).Error
}

func (r *userRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := config.DB.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetDosenByUserID(userID uint) (map[string]interface{}, error) {
	var result struct {
		NamaLengkap string
		Nip         string
	}
	err := config.DB.Table("dosen").Select("nama_lengkap, nip").Where("user_id = ?", userID).Scan(&result).Error
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"nama_lengkap": result.NamaLengkap,
		"no_induk":     result.Nip,
	}, nil
}

func (r *userRepository) GetMahasiswaByUserID(userID uint) (map[string]interface{}, error) {
	var result struct {
		NamaLengkap string
		Nim         string
	}
	err := config.DB.Table("mahasiswa").Select("nama_lengkap, nim").Where("user_id = ?", userID).Scan(&result).Error
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"nama_lengkap": result.NamaLengkap,
		"no_induk":     result.Nim,
	}, nil
}

func (r *userRepository) FindMahasiswaByUserID(userID uint) (*models.Mahasiswa, error) {
	var mhs models.Mahasiswa
	err := config.DB.Where("user_id = ?", userID).First(&mhs).Error
	return &mhs, err
}

func (r *userRepository) FindDosenByUserID(userID uint) (*models.Dosen, error) {
	var dsn models.Dosen
	err := config.DB.Where("user_id = ?", userID).First(&dsn).Error
	return &dsn, err
}

func (r *userRepository) FindMahasiswaByID(id uint) (*models.Mahasiswa, error) {
	var mhs models.Mahasiswa
	err := config.DB.First(&mhs, id).Error
	return &mhs, err
}

func (r *userRepository) FindDosenByID(id uint) (*models.Dosen, error) {
	var dsn models.Dosen
	err := config.DB.First(&dsn, id).Error
	return &dsn, err
}


