<div align="center">

# 🎓 KonsulKu
### *Elevating Academic Consultation with AI Intelligence*

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![GORM](https://img.shields.io/badge/GORM-v1.25-blue?style=for-the-badge&logo=gorm&logoColor=white)](https://gorm.io/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini--Flash-purple?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![RAG](https://img.shields.io/badge/Architecture-RAG-orange?style=for-the-badge)](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
[![Agentic AI](https://img.shields.io/badge/Agentic-Function--Calling-red?style=for-the-badge)](https://ai.google.dev/docs/function_calling)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://golang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

**KonsulKu** is a cutting-edge, full-stack platform designed to revolutionize the way students and lecturers interact. By integrating **Google Gemini AI**, we don't just schedule meetings—we empower students to prepare for them.

[Explore Features](#-key-features) • [View Architecture](#-system-architecture) • [Quick Start](#-installation--setup) • [Demo Credentials](#-demo-credentials)

</div>

## ✨ Key Features

-   🤖 **Agentic AI Assistant**: Powered by **Google Gemini** with **Function Calling** capability, allowing the AI to query the live database to check lecturer availability and profiles.
-   📄 **RAG (Retrieval-Augmented Generation)**: Intelligent Document Analysis that allows students to upload draft proposals (PDF/TXT) for instant, context-aware academic feedback.
-   💬 **Real-time Communication**: Seamless instant messaging powered by **WebSockets** for a responsive chat experience.
-   📅 **Smart Scheduling**: Comprehensive appointment lifecycle management (Pending, Approved, Rejected, Cancelled).
-   🔔 **Live Notifications**: Instant updates for new messages or appointment status changes.
-   🛡️ **Enterprise-Grade Security**: Role-Based Access Control (RBAC) and JWT authentication with Bcrypt encryption.
-   📜 **Audit Logging**: Structured JSON logging using **Logrus** for high-level observability.

---

### 1. Preparation Advice (Fallback System)
```mermaid
graph TD
    A[Student Enters Topic & Problem] --> B{Click Tanya Asisten AI}
    B --> C[Backend calls Gemini API]
    C --> D{API Success?}
    D -- Yes --> E[Display AI-Generated Advice]
    D -- No --> F[Activate Smart Fallback System]
    F --> G[Display Rule-Based Advice]
    E --> H[Student is Ready!]
    G --> H
```

### 2. RAG Flow (Document Analysis)
```mermaid
graph LR
    A[Upload Proposal] --> B[Extract Text]
    B --> C[Inject into Gemini Context]
    C --> D[Generate Feedback]
    D --> E[Display Review Result]
```

### 3. Agentic Workflow (Function Calling)
```mermaid
graph LR
    A["User Ask: 'Is Prof. Budi available?'"] --> B[AI Analyzes Intent]
    B --> C{Need Database?}
    C -- Yes --> D[Call get_lecturer_schedule]
    D --> E[Execute SQL Query]
    E --> F[Return Data to AI]
    F --> G[Generate Natural Response]
```

---

## 🏗️ System Architecture

This project implements a **Clean Layered Architecture** for maximum maintainability:

-   **Frontend**: React (Vite) + Tailwind CSS (Responsive UI)
-   **Backend**: Go (Gin Gonic)
-   **Database**: MySQL (GORM)
-   **Real-time**: Gorilla WebSocket
-   **Service Layer**: Handles complex logic like Gemini AI integration and Fallback mechanisms.

---

## 🔧 Installation & Setup

### 1. Backend Setup
```bash
# Clone the project
git clone https://github.com/luckymalombeke/system-konsulku.git

# Configure Environment
cp .env.example .env # Ensure DB and GEMINI_API_KEY are set

# Run the engine
go run main.go
```

### 2. Frontend Setup
```bash
cd frontend-UI-fix
npm install
npm run dev
```

---

## 🔐 Demo Credentials

The system includes an **Auto-Seeder**. On the first run, you can use these accounts to explore:

| Role | Username (ID) | Password |
| :--- | :--- | :--- |
| **Mahasiswa** | `20010101` | `password123` |
| **Dosen** | `19800101` | `password123` |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">

Built with 💜 by **Lucky Malombeke**

</div>
