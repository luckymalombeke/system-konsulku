package handlers

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"konsulku/services"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/ledongthuc/pdf"
)

var (
	aiService     *services.AIService
	aiServiceOnce sync.Once
)

// GetAIService memastikan service hanya dibuat satu kali (Lazy Loading)
// dan sudah membaca .env saat dibutuhkan pertama kali
func GetAIService() *services.AIService {
	aiServiceOnce.Do(func() {
		aiService = services.NewAIService()
	})
	return aiService
}

type AIRequest struct {
	Topic   string `json:"topic" binding:"required"`
	Problem string `json:"problem" binding:"required"`
}

func HandleAIAdvice(c *gin.Context) {
	var req AIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Topik dan Masalah harus diisi"})
		return
	}

	// Gunakan GetAIService() di sini
	service := GetAIService()
	advice, err := service.GetConsultationAdvice(req.Topic, req.Problem)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungi AI: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"advice": advice,
	})
}

// Struct untuk request chat cerdas
type AIChatRequest struct {
	Message string `json:"message" binding:"required"`
}

// HandleSmartAssistant memproses chat bebas dan bisa memanggil function
func HandleSmartAssistant(c *gin.Context) {
	var req AIChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesan tidak boleh kosong"})
		return
	}

	service := GetAIService()
	response, err := service.AskSmartAssistant(req.Message)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungi Smart Assistant: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}

// Ekstraktor teks dari file .docx (membaca word/document.xml)
func extractTextFromDocx(content []byte) (string, error) {
	reader, err := zip.NewReader(bytes.NewReader(content), int64(len(content)))
	if err != nil {
		return "", err
	}

	for _, f := range reader.File {
		if f.Name == "word/document.xml" {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			defer rc.Close()
			
			xmlData, _ := io.ReadAll(rc)
			
			var textBuf bytes.Buffer
			decoder := xml.NewDecoder(bytes.NewReader(xmlData))
			for {
				t, err := decoder.Token()
				if err != nil {
					break
				}
				if chardata, ok := t.(xml.CharData); ok {
					textBuf.Write(chardata)
					textBuf.WriteString(" ")
				}
			}
			return textBuf.String(), nil
		}
	}
	return "", fmt.Errorf("file word/document.xml tidak ditemukan di dalam .docx")
}

// Ekstraktor teks dari file .pdf
func extractTextFromPDF(content []byte) (string, error) {
	reader := bytes.NewReader(content)
	f, err := pdf.NewReader(reader, int64(len(content)))
	if err != nil {
		return "", err
	}
	b, err := f.GetPlainText()
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	buf.ReadFrom(b)
	return buf.String(), nil
}

// HandleProposalAnalysis menangani upload file proposal mahasiswa
func HandleProposalAnalysis(c *gin.Context) {
	file, header, err := c.Request.FormFile("proposal")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File proposal wajib diunggah"})
		return
	}
	defer file.Close()

	// Baca konten file
	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca file"})
		return
	}

	var extractedText string
	filenameLower := strings.ToLower(header.Filename)

	if strings.HasSuffix(filenameLower, ".docx") {
		text, err := extractTextFromDocx(content)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File .docx tidak valid atau rusak"})
			return
		}
		extractedText = text
	} else if strings.HasSuffix(filenameLower, ".pdf") {
		text, err := extractTextFromPDF(content)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File .pdf tidak valid atau rusak: " + err.Error()})
			return
		}
		extractedText = text
	} else if strings.HasSuffix(filenameLower, ".doc") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format .doc lama belum didukung. Mohon gunakan .docx, .pdf, atau .txt"})
		return
	} else {
		// Asumsi format .txt atau format teks lainnya
		extractedText = string(content)
	}

	// Panggil Service
	service := GetAIService()
	analysis, err := service.AnalyzeProposal(header.Filename, extractedText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"fileName": header.Filename,
		"analysis": analysis,
	})
}

