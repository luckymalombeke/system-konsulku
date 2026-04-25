package repositories

import (
	"konsulku/config"
	"konsulku/models"
)

type ChatRepo struct{}

func (r *ChatRepo) FindChatByParticipants(mhsID, dosenID uint) (*models.KonsultasiChat, error) {
	var chat models.KonsultasiChat
	err := config.DB.Where("mahasiswa_id = ? AND dosen_id = ?", mhsID, dosenID).First(&chat).Error
	return &chat, err
}

func (r *ChatRepo) CreateChat(chat *models.KonsultasiChat) error {
	return config.DB.Create(chat).Error
}

func (r *ChatRepo) SaveMessage(pesan *models.Pesan) error {
	return config.DB.Create(pesan).Error
}

func (r *ChatRepo) GetMessagesByChatID(chatID uint) ([]models.Pesan, error) {
	var pesans []models.Pesan
	err := config.DB.Where("chat_id = ?", chatID).Order("dikirim_at asc").Find(&pesans).Error
	return pesans, err
}
