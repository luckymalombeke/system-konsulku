package services

import (
	"errors"
	"konsulku/models"
	"konsulku/repositories"

	"github.com/sirupsen/logrus"
)

type AppointmentService struct {
	Repo     *repositories.AppointmentRepo
	UserRepo repositories.UserRepository
}

func NewAppointmentService() *AppointmentService {
	return &AppointmentService{
		Repo:     &repositories.AppointmentRepo{},
		UserRepo: repositories.NewUserRepository(),
	}
}

func (s *AppointmentService) CreateBooking(appt *models.Appointment) error {
	appt.Status = "pending"
	return s.Repo.Create(appt)
}

func (s *AppointmentService) GetAppointmentsByIDAndRole(userID uint, role string) ([]models.Appointment, error) {
	if role == "mahasiswa" {
		mhs, err := s.UserRepo.FindMahasiswaByUserID(userID)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"userID": userID,
				"error":  err,
			}).Warn("Mahasiswa not found when getting appointments")
			// Jika tidak ditemukan, kembalikan list kosong saja jangan error
			return []models.Appointment{}, nil
		}
		return s.Repo.GetAllForMahasiswa(mhs.ID)
	} else if role == "dosen" {
		dsn, err := s.UserRepo.FindDosenByUserID(userID)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"userID": userID,
				"error":  err,
			}).Warn("Dosen not found when getting appointments")
			// Jika tidak ditemukan, kembalikan list kosong saja jangan error
			return []models.Appointment{}, nil
		}
		return s.Repo.GetAllForDosen(dsn.ID)
	}
	logrus.WithField("role", role).Error("Invalid role when getting appointments")
	return nil, errors.New("invalid role")
}

func (s *AppointmentService) GetByID(id uint) (*models.Appointment, error) {
	return s.Repo.FindByID(id)
}
