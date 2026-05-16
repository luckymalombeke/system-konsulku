# 📑 KonsulKu API Documentation

Dokumentasi ini dibuat untuk membantu tim Frontend dalam mengintegrasikan antarmuka dengan sistem Backend KonsulKu yang berbasis Go & AI.

---

## 🚀 Base URL
- **Production (Backend)**: `https://konsulku-production.up.railway.app`
- **WebSocket**: `wss://konsulku-production.up.railway.app/api/ws`
- **Development**: `http://localhost:8081`

---

## 🔐 Authentication
Semua endpoint di bawah grup `/api` membutuhkan header:
`Authorization: Bearer <your_token>`

### 1. Login
- **URL**: `/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "20010101",
    "password": "password123",
    "role": "mahasiswa"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbG...",
    "user": {
      "id": 1,
      "username": "20010101",
      "role": "mahasiswa",
      "nama_lengkap": "Lucky Malombeke"
    }
  }
  ```

---

## 📅 Appointment (Janji Temu)

### 1. Buat Janji Temu
- **URL**: `/api/appointment`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "dosen_id": 2,
    "tanggal": "2026-05-20T10:00:00Z",
    "topik": "Bimbingan Skripsi Bab 1",
    "deskripsi": "Ingin konsultasi mengenai latar belakang."
  }
  ```

### 2. Lihat Semua Janji Temu
- **URL**: `/api/appointment`
- **Method**: `GET`

---

## 🤖 AI Assistant (Fitur Unggulan)

### 1. Saran Persiapan (AI Advice)
Membantu mahasiswa menyiapkan bahan sebelum bertemu dosen.
- **URL**: `/api/ai/advice`
- **Method**: `POST`
- **Body**: `{"topic": "...", "problem": "..."}`

### 2. Analisis Proposal (Critical Review)
Menganalisis file proposal dan mencocokkannya dengan riwayat chat dosen.
- **URL**: `/api/ai/analyze-proposal`
- **Method**: `POST`
- **Body**: `Multipart Form` (Key: `proposal`, Value: `File .pdf/.docx`)
- **Response**: Mengembalikan analisis tajam dan sinkronisasi dengan arahan dosen.

### 3. Chat Interaktif dengan Proposal
Tanya jawab spesifik mengenai isi dokumen yang diunggah.
- **URL**: `/api/ai/chat-proposal`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "fileName": "Proposal_Lucky.pdf",
    "fullText": "...",
    "question": "Apakah metodologi saya sudah benar?"
  }
  ```

---

## 💬 Real-time Chat & WebSocket

### 1. Ambil Riwayat Pesan
- **URL**: `/api/chat/:target_id`
- **Method**: `GET`

### 2. WebSocket Connection
Digunakan untuk notifikasi dan chat instan.
- **URL**: `/api/ws?token=<your_token>`
- **Protocol**: `WSS`

---

## 🩺 Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Guna**: Untuk mengecek apakah server sedang online/crashed.

---

**Note**: Pastikan tim Frontend menggunakan `VITE_API_URL` di file `.env` mereka untuk fleksibilitas perpindahan antara server Lokal dan Production.
