package repositories

import (
	"konsulku/config"
	"konsulku/models"
)

type NotificationRepo struct{}

func (r *NotificationRepo) Create(notif *models.Notifikasi) error {
	return config.DB.Create(notif).Error
}

func (r *NotificationRepo) GetUnreadForUser(userID uint) ([]models.Notifikasi, error) {
	var notifs []models.Notifikasi
	err := config.DB.Where("user_id = ? AND is_read = ?", userID, false).Order("created_at desc").Find(&notifs).Error
	return notifs, err
}
