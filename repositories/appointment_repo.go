package repositories

import (
	"konsulku/config"
	"konsulku/models"
)

type AppointmentRepo struct{}

func (r *AppointmentRepo) Create(appt *models.Appointment) error {
	return config.DB.Create(appt).Error
}

func (r *AppointmentRepo) GetAllForDosen(dosenID uint) ([]models.Appointment, error) {
	var appts []models.Appointment
	err := config.DB.Preload("Mahasiswa.User").Preload("Mahasiswa").Where("dosen_id = ?", dosenID).Find(&appts).Error
	return appts, err
}

func (r *AppointmentRepo) GetAllForMahasiswa(mahasiswaID uint) ([]models.Appointment, error) {
	var appts []models.Appointment
	err := config.DB.Preload("Dosen.User").Preload("Dosen").Where("mahasiswa_id = ?", mahasiswaID).Find(&appts).Error
	return appts, err
}

func (r *AppointmentRepo) FindByID(id uint) (*models.Appointment, error) {
	var appt models.Appointment
	err := config.DB.Preload("Dosen.User").Preload("Dosen").Preload("Mahasiswa.User").Preload("Mahasiswa").First(&appt, id).Error
	return &appt, err
}

func (r *AppointmentRepo) Save(appt *models.Appointment) error {
	return config.DB.Save(appt).Error
}
