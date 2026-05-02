package repositories

import (
	"konsulku/config"
	"konsulku/models"
)

type NotificationRepo struct{}

func (r *NotificationRepo) Create(notif *models.Notifikasi) error {
	return config.DB.Create(notif).Error
}

func (r *NotificationRepo) GetForUser(userID uint) ([]models.Notifikasi, error) {
	var notifs []models.Notifikasi
	err := config.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notifs).Error
	return notifs, err
}

func (r *NotificationRepo) MarkAllAsRead(userID uint) error {
	return config.DB.Model(&models.Notifikasi{}).Where("user_id = ? AND is_read = ?", userID, false).Update("is_read", true).Error
}
