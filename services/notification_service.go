package services

import (
	"errors"
	"konsulku/models"
	"konsulku/repositories"
	"konsulku/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type NotificationService struct {
	Repo     *repositories.NotificationRepo
	ApptRepo *repositories.AppointmentRepo
	UserRepo repositories.UserRepository
}

func NewNotificationService() *NotificationService {
	return &NotificationService{
		Repo:     &repositories.NotificationRepo{},
		ApptRepo: &repositories.AppointmentRepo{},
		UserRepo: repositories.NewUserRepository(),
	}
}

func (s *NotificationService) RejectAppointment(apptID uint, dosenUserID uint, alasan string) error {
	appt, err := s.ApptRepo.FindByID(apptID)
	if err != nil {
		logrus.WithField("apptID", apptID).Error("Failed to find appointment")
		return errors.New("appointment tidak ditemukan")
	}

	dsn, err := s.UserRepo.FindDosenByUserID(dosenUserID)
	if err != nil {
		logrus.WithField("dosenUserID", dosenUserID).Error("Failed to find dosen")
		return errors.New("dosen tidak valid")
	}

	if appt.DosenID != dsn.ID {
		logrus.WithFields(logrus.Fields{
			"apptDosenID": appt.DosenID,
			"dosenID":     dsn.ID,
		}).Warn("Unauthorized appointment rejection attempt")
		return errors.New("appointment ini bukan milik anda")
	}

	appt.Status = "rejected"
	appt.AlasanPenolakan = &alasan
	if err := s.ApptRepo.Save(appt); err != nil {
		logrus.WithField("apptID", appt.ID).Error("Failed to save appointment")
		return err
	}

	// I'll replace it with UserRepo!
	mhs, err := s.UserRepo.FindMahasiswaByID(appt.MahasiswaID)
	if err != nil {
		logrus.WithField("mahasiswaID", appt.MahasiswaID).Error("Mahasiswa not found")
		return errors.New("mahasiswa tidak ditemukan")
	}

	notif := &models.Notifikasi{
		UserID:      mhs.UserID,
		Judul:       "Appointment Ditolak",
		Pesan:       alasan,
		Tipe:        "appointment_rejected",
		ReferensiID: appt.ID,
		IsRead:      false,
	}

	if err := s.Repo.Create(notif); err != nil {
		logrus.WithField("userID", mhs.UserID).Error("Failed to create notification")
		return err
	}

	// Push via WebSocket
	utils.Manager.BroadcastToUser(mhs.UserID, gin.H{
		"type":    "NEW_NOTIFICATION",
		"payload": notif,
	})

	return nil

}

func (s *NotificationService) GetMyNotifications(userID uint) ([]models.Notifikasi, error) {
	return s.Repo.GetUnreadForUser(userID)
}

func (s *NotificationService) CancelAppointment(apptID uint, mahasiswaUserID uint, alasan string) error {
	appt, err := s.ApptRepo.FindByID(apptID)
	if err != nil {
		logrus.WithField("apptID", apptID).Error("Failed to find appointment")
		return errors.New("appointment tidak ditemukan")
	}

	mhs, err := s.UserRepo.FindMahasiswaByUserID(mahasiswaUserID)
	if err != nil {
		logrus.WithField("mahasiswaUserID", mahasiswaUserID).Error("Mahasiswa not found")
		return errors.New("mahasiswa tidak valid")
	}

	if appt.MahasiswaID != mhs.ID {
		logrus.WithFields(logrus.Fields{
			"apptMahasiswaID": appt.MahasiswaID,
			"mahasiswaID":     mhs.ID,
		}).Warn("Unauthorized appointment cancellation attempt")
		return errors.New("appointment ini bukan milik anda")
	}

	// Hanya bisa membatalkan jika status masih pending
	if appt.Status != "pending" && appt.Status != "Pending" {
		return errors.New("hanya appointment dengan status 'pending' yang bisa dibatalkan")
	}

	appt.Status = "cancelled"
	alasanCancel := alasan
	appt.AlasanPenolakan = &alasanCancel
	if err := s.ApptRepo.Save(appt); err != nil {
		logrus.WithField("apptID", appt.ID).Error("Failed to save appointment cancellation")
		return err
	}

	// Kirim notifikasi ke dosen bahwa mahasiswa membatalkan
	dsn, err := s.UserRepo.FindDosenByID(appt.DosenID)
	if err != nil {
		logrus.WithField("dosenID", appt.DosenID).Error("Dosen not found")
		return errors.New("dosen tidak ditemukan")
	}

	notif := &models.Notifikasi{
		UserID:      dsn.UserID,
		Judul:       "Appointment Dibatalkan",
		Pesan:       "Mahasiswa membatalkan appointment. Alasan: " + alasan,
		Tipe:        "appointment_cancelled",
		ReferensiID: appt.ID,
		IsRead:      false,
	}

	if err := s.Repo.Create(notif); err != nil {
		logrus.WithField("userID", dsn.UserID).Error("Failed to create notification for cancel")
		return err
	}

	// Push via WebSocket
	utils.Manager.BroadcastToUser(dsn.UserID, gin.H{
		"type":    "NEW_NOTIFICATION",
		"payload": notif,
	})

	return nil

}
