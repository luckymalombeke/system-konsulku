package services

import (
	"errors"
	"konsulku/models"
	"konsulku/repositories"
	"konsulku/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type ChatService struct {
	Repo     *repositories.ChatRepo
	UserRepo repositories.UserRepository
}

func NewChatService() *ChatService {
	return &ChatService{
		Repo:     &repositories.ChatRepo{},
		UserRepo: repositories.NewUserRepository(),
	}
}

func (s *ChatService) SendMessage(pengirimID uint, role string, targetUserID uint, teks string) error {
	var mhsID, dosenID uint

	if role == "mahasiswa" {
		mhs, err := s.UserRepo.FindMahasiswaByUserID(pengirimID)
		if err != nil {
			logrus.WithField("pengirimID", pengirimID).Error("Pengirim mahasiswa tidak ditemukan")
			return errors.New("pengirim mahasiswa tidak ditemukan")
		}
		dsn, err := s.UserRepo.FindDosenByUserID(targetUserID)
		if err != nil {
			logrus.WithField("targetUserID", targetUserID).Error("Target dosen tidak ditemukan")
			return errors.New("target dosen tidak ditemukan")
		}
		mhsID = mhs.ID
		dosenID = dsn.ID
	} else if role == "dosen" {
		dsn, err := s.UserRepo.FindDosenByUserID(pengirimID)
		if err != nil {
			logrus.WithField("pengirimID", pengirimID).Error("Pengirim dosen tidak ditemukan")
			return errors.New("pengirim dosen tidak ditemukan")
		}
		mhs, err := s.UserRepo.FindMahasiswaByUserID(targetUserID)
		if err != nil {
			logrus.WithField("targetUserID", targetUserID).Error("Target mahasiswa tidak ditemukan")
			return errors.New("target mahasiswa tidak ditemukan")
		}
		mhsID = mhs.ID
		dosenID = dsn.ID
	} else {
		logrus.WithField("role", role).Error("Invalid role in SendMessage")
		return errors.New("role tidak valid")
	}

	chat, err := s.Repo.FindChatByParticipants(mhsID, dosenID)
	if err != nil {
		chat = &models.KonsultasiChat{
			MahasiswaID: mhsID,
			DosenID:     dosenID,
		}
		if createErr := s.Repo.CreateChat(chat); createErr != nil {
			logrus.WithError(createErr).Error("Failed to create chat session")
			return createErr
		}
	}

	pesan := &models.Pesan{
		ChatID:     chat.ID,
		PengirimID: pengirimID,
		Teks:       teks,
	}

	if err := s.Repo.SaveMessage(pesan); err != nil {
		logrus.WithError(err).Error("Failed to save message")
		return err
	}

	// WEBSET LOGIC: Jika target sedang online, kirim pesan langsung
	utils.Manager.BroadcastToUser(targetUserID, gin.H{
		"type":    "NEW_CHAT",
		"payload": pesan,
	})

	return nil
}

func (s *ChatService) GetMessages(pengirimID uint, role string, targetUserID uint) ([]models.Pesan, error) {
	var mhsID, dosenID uint

	if role == "mahasiswa" {
		mhs, _ := s.UserRepo.FindMahasiswaByUserID(pengirimID)
		dsn, _ := s.UserRepo.FindDosenByUserID(targetUserID)
		if mhs != nil { mhsID = mhs.ID }
		if dsn != nil { dosenID = dsn.ID }
	} else {
		dsn, _ := s.UserRepo.FindDosenByUserID(pengirimID)
		mhs, _ := s.UserRepo.FindMahasiswaByUserID(targetUserID)
		if mhs != nil { mhsID = mhs.ID }
		if dsn != nil { dosenID = dsn.ID }
	}

	chat, err := s.Repo.FindChatByParticipants(mhsID, dosenID)
	if err != nil {
		return []models.Pesan{}, nil // no chat yet
	}

	return s.Repo.GetMessagesByChatID(chat.ID)
}
