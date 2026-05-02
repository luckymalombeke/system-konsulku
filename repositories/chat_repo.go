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

func (r *ChatRepo) GetMessageByID(id uint) (*models.Pesan, error) {
	var pesan models.Pesan
	err := config.DB.Preload("Chat").First(&pesan, id).Error
	return &pesan, err
}

func (r *ChatRepo) UpdateMessage(pesan *models.Pesan) error {
	return config.DB.Save(pesan).Error
}

func (r *ChatRepo) GetActiveChatsByDosen(dosenID uint) ([]models.KonsultasiChat, error) {
	var chats []models.KonsultasiChat
	err := config.DB.Preload("Mahasiswa").Preload("Mahasiswa.User").Where("dosen_id = ?", dosenID).Find(&chats).Error
	return chats, err
}

func (r *ChatRepo) GetActiveChatsByMahasiswa(mhsID uint) ([]models.KonsultasiChat, error) {
	var chats []models.KonsultasiChat
	err := config.DB.Preload("Dosen").Preload("Dosen.User").Where("mahasiswa_id = ?", mhsID).Find(&chats).Error
	return chats, err
}
