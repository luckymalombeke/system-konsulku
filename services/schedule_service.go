package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"konsulku/config"
	"konsulku/models"
	"net/http"
	"os"
	"sort"
	"time"
)

type ScheduleService struct {
	AIService *AIService
}

func NewScheduleService() *ScheduleService {
	return &ScheduleService{
		AIService: NewAIService(),
	}
}

// GetDosenSchedule mengambil jadwal ketersediaan dosen dari database
func (s *ScheduleService) GetDosenSchedule(dosenID uint) ([]models.DosenAvailability, error) {
	var schedule []models.DosenAvailability
	if err := config.DB.Where("dosen_id = ? AND is_active = ?", dosenID, true).Find(&schedule).Error; err != nil {
		return nil, err
	}
	return schedule, nil
}

// GetDosenExistingAppointments mengambil appointment dosen untuk detect conflicts
func (s *ScheduleService) GetDosenExistingAppointments(dosenID uint, daysAhead int) ([]models.Appointment, error) {
	var appointments []models.Appointment
	startDate := time.Now()
	endDate := startDate.AddDate(0, 0, daysAhead)

	if err := config.DB.Where("dosen_id = ? AND status IN ? AND tanggal_request BETWEEN ? AND ?",
		dosenID,
		[]string{"pending", "accepted"},
		startDate.Format("2006-01-02"),
		endDate.Format("2006-01-02"),
	).Find(&appointments).Error; err != nil {
		return nil, err
	}
	return appointments, nil
}

// GetMahasiswaPreferences mengambil preferensi waktu mahasiswa dari riwayat
func (s *ScheduleService) GetMahasiswaPreferences(mahasiswaID uint) map[string]interface{} {
	var appointments []models.Appointment
	preferences := map[string]interface{}{
		"preferred_days": []int{},
		"preferred_time": "morning",
	}

	if err := config.DB.Where("mahasiswa_id = ? AND status = ?", mahasiswaID, "accepted").
		Limit(10).
		Order("tanggal_request DESC").
		Find(&appointments).Error; err != nil {
		return preferences
	}

	// Analisis pola waktu dari riwayat appointment
	dayCount := make(map[int]int)
	timeCount := make(map[string]int)

	for _, appt := range appointments {
		parsedTime, _ := time.Parse("2006-01-02", appt.TanggalRequest)
		dayCount[int(parsedTime.Weekday())]++

		// Parse jam_request (format: "10:00")
		if len(appt.JamRequest) >= 2 {
			hour := appt.JamRequest[:2]
			hourInt := 0
			fmt.Sscanf(hour, "%d", &hourInt)

			if hourInt >= 6 && hourInt < 12 {
				timeCount["morning"]++
			} else if hourInt >= 12 && hourInt < 17 {
				timeCount["afternoon"]++
			} else {
				timeCount["evening"]++
			}
		}
	}

	// Tentukan hari preferensi
	if len(dayCount) > 0 {
		var preferredDays []int
		for day, count := range dayCount {
			if count >= 2 {
				preferredDays = append(preferredDays, day)
			}
		}
		if len(preferredDays) > 0 {
			sort.Ints(preferredDays)
			preferences["preferred_days"] = preferredDays
		}
	}

	// Tentukan waktu preferensi
	if len(timeCount) > 0 {
		bestTime := "morning"
		bestCount := 0
		for t, count := range timeCount {
			if count > bestCount {
				bestCount = count
				bestTime = t
			}
		}
		preferences["preferred_time"] = bestTime
	}

	return preferences
}

// SuggestScheduleSlots adalah main function yang call AI untuk suggest 3 slots terbaik
func (s *ScheduleService) SuggestScheduleSlots(req models.SuggestSlotRequest, mahasiswaID uint) (*models.SuggestSlotResponse, error) {
	// 1. Get dosen info
	var dosen models.Dosen
	if err := config.DB.First(&dosen, req.DosenID).Error; err != nil {
		return nil, fmt.Errorf("dosen tidak ditemukan")
	}

	// 2. Get dosen schedule
	dosenSchedule, err := s.GetDosenSchedule(req.DosenID)
	if err != nil || len(dosenSchedule) == 0 {
		return nil, fmt.Errorf("jadwal dosen belum dikonfigurasi atau dosen tidak tersedia")
	}

	// 3. Get existing appointments
	existingAppts, _ := s.GetDosenExistingAppointments(req.DosenID, 30)

	// 4. Get mahasiswa preferences
	preferences := s.GetMahasiswaPreferences(mahasiswaID)

	// 5. Build context untuk AI
	contextData := map[string]interface{}{
		"dosen_name":       dosen.NamaLengkap,
		"dosen_schedule":   dosenSchedule,
		"existing_appts":   existingAppts,
		"topic":            req.Topic,
		"preferences":      preferences,
		"duration_minutes": 30,
		"days_to_suggest":  7,
	}

	// 6. Call Groq AI untuk intelligent suggestions
	suggestions, err := s.callAIForScheduling(contextData)
	if err != nil {
		// Fallback ke simple algorithm jika AI gagal
		suggestions = s.generateSimpleSuggestions(dosenSchedule, existingAppts)
	}

	response := &models.SuggestSlotResponse{
		Suggestions: suggestions,
		Message:     fmt.Sprintf("Berikut adalah 3 waktu terbaik untuk konsultasi dengan %s tentang '%s'", dosen.NamaLengkap, req.Topic),
	}

	return response, nil
}

// callAIForScheduling memanggil Groq AI untuk intelligent scheduling
func (s *ScheduleService) callAIForScheduling(contextData map[string]interface{}) ([]models.ScheduleSuggestion, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY tidak tersedia")
	}

	// Prepare context untuk AI
	scheduleJSON, _ := json.MarshalIndent(contextData["dosen_schedule"], "", "  ")
	apptsJSON, _ := json.MarshalIndent(contextData["existing_appts"], "", "  ")

	prompt := fmt.Sprintf(`
Anda adalah asisten scheduling yang cerdas. Berdasarkan informasi berikut:

**Dosen:** %s
**Topik Konsultasi:** %s
**Jadwal Ketersediaan Dosen:**
%s

**Appointment yang Sudah Ada:**
%s

**Preferensi Mahasiswa:** %v

**Task:** Suggest EXACTLY 3 slot waktu terbaik untuk appointment dalam format:
[
  {"slot": "YYYY-MM-DD HH:00", "reason": "penjelasan singkat mengapa slot ini bagus", "priority": 1},
  {"slot": "YYYY-MM-DD HH:00", "reason": "...", "priority": 2},
  {"slot": "YYYY-MM-DD HH:00", "reason": "...", "priority": 3}
]

Pertimbangkan:
1. Jadwal ketersediaan dosen
2. Tidak ada conflict dengan appointment yang sudah ada
3. Preferensi waktu mahasiswa
4. Topik konsultasi
5. Slot minimal 30 menit

Return HANYA array JSON, tanpa penjelasan tambahan.
`,
		contextData["dosen_name"],
		contextData["topic"],
		string(scheduleJSON),
		string(apptsJSON),
		contextData["preferences"],
	)

	requestBody := map[string]interface{}{
		"model": "mixtral-8x7b-32768",
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"max_tokens": 500,
	}

	jsonBody, _ := json.Marshal(requestBody)

	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var groqResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("groq API error: %v", groqResp)
	}

	// Parse response
	choices, ok := groqResp["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return nil, fmt.Errorf("invalid groq response format")
	}

	choice := choices[0].(map[string]interface{})
	message := choice["message"].(map[string]interface{})
	content := message["content"].(string)

	// Parse JSON array dari AI response
	var aiSuggestions []map[string]interface{}
	if err := json.Unmarshal([]byte(content), &aiSuggestions); err != nil {
		return nil, err
	}

	// Convert ke ScheduleSuggestion struct
	var suggestions []models.ScheduleSuggestion
	for i, s := range aiSuggestions {
		priority := i + 1
		if p, ok := s["priority"].(float64); ok {
			priority = int(p)
		}

		suggestion := models.ScheduleSuggestion{
			SlotDateTime: s["slot"].(string),
			Reasoning:    s["reason"].(string),
			Priority:     priority,
			Confidence:   0.9,
		}
		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
}

// generateSimpleSuggestions adalah fallback jika AI gagal
func (s *ScheduleService) generateSimpleSuggestions(schedule []models.DosenAvailability, existingAppts []models.Appointment) []models.ScheduleSuggestion {
	var suggestions []models.ScheduleSuggestion
	bookedSlots := make(map[string]bool)

	// Mark existing appointments sebagai booked
	for _, appt := range existingAppts {
		key := appt.TanggalRequest + " " + appt.JamRequest
		bookedSlots[key] = true
	}

	// Generate available slots dari schedule
	now := time.Now()
	for i := 0; i < 30; i++ {
		checkDate := now.AddDate(0, 0, i)
		dayOfWeek := int(checkDate.Weekday())

		for _, sched := range schedule {
			if sched.DayOfWeek == dayOfWeek {
				// Generate hourly slots
				startHour := parseHour(sched.StartTime)
				endHour := parseHour(sched.EndTime)

				for h := startHour; h < endHour; h++ {
					slotTime := fmt.Sprintf("%s %02d:00", checkDate.Format("2006-01-02"), h)
					if !bookedSlots[slotTime] && len(suggestions) < 3 {
						suggestion := models.ScheduleSuggestion{
							SlotDateTime: slotTime,
							Reasoning:    fmt.Sprintf("Slot tersedia pada %s jam %02d:00", sched.DayName, h),
							Priority:     len(suggestions) + 1,
							Confidence:   0.7,
						}
						suggestions = append(suggestions, suggestion)
					}
				}
				break
			}
		}

		if len(suggestions) >= 3 {
			break
		}
	}

	return suggestions
}

func parseHour(timeStr string) int {
	var hour int
	fmt.Sscanf(timeStr, "%d", &hour)
	return hour
}
