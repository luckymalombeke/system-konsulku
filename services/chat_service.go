package services

import (
	"errors"
	"time"
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

func (s *ChatService) SendMessage(pengirimID uint, role string, targetUserID uint, teks string) (*models.Pesan, error) {
	var mhsID, dosenID uint

	if role == "mahasiswa" {
		mhs, err := s.UserRepo.FindMahasiswaByUserID(pengirimID)
		if err != nil {
			logrus.WithField("pengirimID", pengirimID).Error("Pengirim mahasiswa tidak ditemukan")
			return nil, errors.New("pengirim mahasiswa tidak ditemukan")
		}
		dsn, err := s.UserRepo.FindDosenByUserID(targetUserID)
		if err != nil {
			logrus.WithField("targetUserID", targetUserID).Error("Target dosen tidak ditemukan")
			return nil, errors.New("target dosen tidak ditemukan")
		}
		mhsID = mhs.ID
		dosenID = dsn.ID
	} else if role == "dosen" {
		dsn, err := s.UserRepo.FindDosenByUserID(pengirimID)
		if err != nil {
			logrus.WithField("pengirimID", pengirimID).Error("Pengirim dosen tidak ditemukan")
			return nil, errors.New("pengirim dosen tidak ditemukan")
		}
		mhs, err := s.UserRepo.FindMahasiswaByUserID(targetUserID)
		if err != nil {
			logrus.WithField("targetUserID", targetUserID).Error("Target mahasiswa tidak ditemukan")
			return nil, errors.New("target mahasiswa tidak ditemukan")
		}
		mhsID = mhs.ID
		dosenID = dsn.ID
	} else {
		logrus.WithField("role", role).Error("Invalid role in SendMessage")
		return nil, errors.New("role tidak valid")
	}

	chat, err := s.Repo.FindChatByParticipants(mhsID, dosenID)
	if err != nil {
		chat = &models.KonsultasiChat{
			MahasiswaID: mhsID,
			DosenID:     dosenID,
			DibuatPada:  time.Now(),
		}
		if createErr := s.Repo.CreateChat(chat); createErr != nil {
			logrus.WithError(createErr).Error("Failed to create chat session")
			return nil, createErr
		}
	}

	pesan := &models.Pesan{
		ChatID:     chat.ID,
		PengirimID: pengirimID,
		Teks:       teks,
		DikirimAt:  time.Now(),
	}

	if err := s.Repo.SaveMessage(pesan); err != nil {
		logrus.WithError(err).Error("Failed to save message")
		return nil, err
	}

	// WEBSET LOGIC: Jika target sedang online, kirim pesan langsung
	utils.Manager.BroadcastToUser(targetUserID, gin.H{
		"type":    "NEW_CHAT",
		"payload": pesan,
	})

	return pesan, nil
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

func (s *ChatService) EditMessage(pengirimID uint, messageID uint, newTeks string) error {
	pesan, err := s.Repo.GetMessageByID(messageID)
	if err != nil {
		return errors.New("pesan tidak ditemukan")
	}

	if pesan.PengirimID != pengirimID {
		return errors.New("tidak memiliki akses untuk mengedit pesan ini")
	}

	pesan.Teks = newTeks
	pesan.Diedit = true

	if err := s.Repo.UpdateMessage(pesan); err != nil {
		return err
	}

	targetUserID := s.getTargetUserID(pesan.Chat, pengirimID)
	if targetUserID > 0 {
		utils.Manager.BroadcastToUser(targetUserID, gin.H{
			"type":    "MESSAGE_EDITED",
			"payload": pesan,
		})
	}

	return nil
}

func (s *ChatService) DeleteMessage(pengirimID uint, messageID uint) error {
	pesan, err := s.Repo.GetMessageByID(messageID)
	if err != nil {
		return errors.New("pesan tidak ditemukan")
	}

	if pesan.PengirimID != pengirimID {
		return errors.New("tidak memiliki akses untuk menghapus pesan ini")
	}

	pesan.Teks = "Pesan ini telah dihapus"
	pesan.Dihapus = true

	if err := s.Repo.UpdateMessage(pesan); err != nil {
		return err
	}

	targetUserID := s.getTargetUserID(pesan.Chat, pengirimID)
	if targetUserID > 0 {
		utils.Manager.BroadcastToUser(targetUserID, gin.H{
			"type":    "MESSAGE_DELETED",
			"payload": pesan,
		})
	}

	return nil
}

func (s *ChatService) getTargetUserID(chat models.KonsultasiChat, pengirimID uint) uint {
	mhs, errMhs := s.UserRepo.FindMahasiswaByID(chat.MahasiswaID)
	dsn, errDsn := s.UserRepo.FindDosenByID(chat.DosenID)

	if errMhs == nil && mhs.UserID != pengirimID {
		return mhs.UserID
	}
	if errDsn == nil && dsn.UserID != pengirimID {
		return dsn.UserID
	}
	return 0
}

func (s *ChatService) GetChatContacts(userID uint, role string) ([]interface{}, error) {
	var contacts []interface{}

	if role == "dosen" {
		dsn, err := s.UserRepo.FindDosenByUserID(userID)
		if err != nil {
			return nil, errors.New("dosen tidak ditemukan")
		}
		chats, err := s.Repo.GetActiveChatsByDosen(dsn.ID)
		if err != nil {
			return nil, err
		}
		for _, chat := range chats {
			contacts = append(contacts, chat.Mahasiswa)
		}
	} else if role == "mahasiswa" {
		mhs, err := s.UserRepo.FindMahasiswaByUserID(userID)
		if err != nil {
			return nil, errors.New("mahasiswa tidak ditemukan")
		}
		chats, err := s.Repo.GetActiveChatsByMahasiswa(mhs.ID)
		if err != nil {
			return nil, err
		}
		for _, chat := range chats {
			contacts = append(contacts, chat.Dosen)
		}
	} else {
		return nil, errors.New("role tidak valid")
	}

	return contacts, nil
}
