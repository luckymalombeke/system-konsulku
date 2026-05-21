package models

import "time"

// DosenAvailability represents ketersediaan dosen per hari
type DosenAvailability struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	DosenID      uint      `json:"dosen_id"`
	Dosen        Dosen     `gorm:"foreignKey:DosenID" json:"dosen"`
	DayOfWeek    int       `json:"day_of_week"` // 0 = Sunday, 1 = Monday, dst
	DayName      string    `json:"day_name"`    // "Senin", "Selasa", etc
	StartTime    string    `json:"start_time"`  // "09:00"
	EndTime      string    `json:"end_time"`    // "15:00"
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (DosenAvailability) TableName() string {
	return "dosen_availability"
}

// ScheduleSuggestion adalah response dari AI scheduling
type ScheduleSuggestion struct {
	SlotDateTime string `json:"slot_date_time"` // "2026-05-25 10:00"
	Reasoning    string `json:"reasoning"`       // Mengapa slot ini disuggest
	Confidence   float64 `json:"confidence"`     // 0.0 - 1.0
	Priority     int    `json:"priority"`        // 1 (best), 2, 3
}

// SuggestSlotRequest adalah payload untuk request suggestion
type SuggestSlotRequest struct {
	DosenID      uint   `json:"dosen_id" binding:"required"`
	Topic        string `json:"topic" binding:"required"`
	PreferredDays []int `json:"preferred_days"`    // Optional: [1, 2, 3] = Mon, Tue, Wed
	PreferredTime string `json:"preferred_time"`   // Optional: "morning", "afternoon", "evening"
	Duration     int   `json:"duration"`          // Durasi dalam menit (default: 30)
}

// SuggestSlotResponse adalah response dari endpoint
type SuggestSlotResponse struct {
	Suggestions []ScheduleSuggestion `json:"suggestions"`
	Message     string               `json:"message"`
}
