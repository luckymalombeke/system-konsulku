<div align="center">

# 🎓 KonsulKu
### *Elevating Academic Consultation with AI Intelligence*

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![GORM](https://img.shields.io/badge/ORM-GORM-blue?style=for-the-badge&logo=gorm&logoColor=white)](https://gorm.io/)
[![Groq AI](https://img.shields.io/badge/AI-Groq-orange?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Agentic AI](https://img.shields.io/badge/Architecture-Agentic--AI-red?style=for-the-badge)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://golang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

**KonsulKu** is a full-stack platform designed to facilitate academic consultations. By integrating **Groq AI**, the system provides intelligent preparation advice and document analysis to enhance the quality of student-lecturer interactions.

[Explore Features](#-key-features) • [View Architecture](#-system-architecture) • [Quick Start](#-installation--setup) • [Demo Credentials](#-demo-credentials)

</div>

## ✨ Key Features

-   🤖 **Dual-LLM Architecture**: Strategically routes low-latency agentic chat workflows to **Groq AI (Llama 3)**, and high-context document analysis to **Google Gemini 2.5 Flash**.
-   📄 **Advanced RAG (Retrieval-Augmented Generation)**: Implements native text chunking, **Vector Embeddings**, and Cosine Similarity semantic search to extract relevant thesis contexts. Supports `.docx` and `.pdf` uploads.
-   💬 **Real-time Communication**: Seamless instant messaging powered by **WebSockets** for a responsive chat experience.
-   📅 **Dynamic Scheduling**: Allows students to request custom consultation time ranges, pending lecturer approval, replacing rigid time slots.
-   🔔 **Live Notifications**: Instant updates for new messages or appointment status changes.
-   🛡️ **Enterprise-Grade Security**: Role-Based Access Control (RBAC) and JWT authentication with Bcrypt encryption.
-   📜 **Audit Logging**: Structured JSON logging using **Logrus** for high-level observability.

---

## 🤖 AI Workflow

### 1. Advanced RAG (Document Analysis)
1. User uploads proposal (.docx or .pdf)
2. Backend extracts raw text using Go libraries (`archive/zip` or `ledongthuc/pdf`)
3. Text is partitioned (Chunking) and converted into mathematical vectors using `gemini-embedding-2`
4. Semantic Search (Cosine Similarity) fetches the top most relevant chunks
5. Relevant chunks are injected into the Gemini 2.5 Flash context
6. AI generates highly accurate, token-efficient academic feedback

```mermaid
graph LR
    A[Upload File] --> B[Extract Text]
    B --> C[Chunking & Vector Embeddings]
    C --> D[Semantic Search]
    D --> E[Gemini Generates Feedback]
```

### 2. Agentic AI (Function Calling)
1. User interacts with AI assistant
2. AI analyzes intent and determines if data access is required
3. AI triggers a function call (e.g., `get_lecturer_schedule`)
4. Backend executes the function against the database
5. Data is returned to the AI model
6. AI generates a natural language response based on real-time data

```mermaid
graph LR
    A["User Ask: 'Is Prof. Budi available?'"] --> B[AI Analyzes Intent]
    B --> C{Need Database?}
    C -- Yes --> D[Call get_lecturer_schedule]
    D --> E[Execute SQL Query]
    E --> F[Return Data to AI]
    F --> G[Generate Natural Response]
```

## 🧠 AI Output Example

**Input:**
"Apakah judul skripsi saya sudah tepat?"

**Output:**
"Judul yang Anda ajukan sudah cukup spesifik, namun bagian metode penelitian masih belum tergambar jelas. Disarankan untuk menambahkan pendekatan penelitian..."

---

## 🔄 System Flow

1. **Authentication**: User login → JWT issued.
2. **Consultation**: User creates appointment → Data persisted to DB.
3. **AI Analysis**: User uploads document → RAG processing via Groq AI.
4. **Communication**: Real-time chat with lecturers or AI → WebSocket.
5. **Updates**: System pushes real-time status notifications.

---

## 🚀 AI-Assisted Engineering & Leadership

This project showcases modern **Software Engineering Leadership**. While the codebase was co-authored with an Advanced AI Assistant, the **Architecture, Debugging Direction, and Problem Solving** were strictly human-led. Key highlights of this human-AI collaboration include:

- **System Architecture & Vision:** Architecting the end-to-end flow from React frontend to Go backend, integrating MySQL, WebSockets, and Groq API.
- **Complex Debugging:** Successfully directing the AI to resolve deep OS-level networking blocks (e.g., Windows socket/port binding issues) and identifying logic gaps in WebSocket payload delivery.
- **Advanced Problem Solving:** When the AI API rejected binary `.docx` files with "invalid UTF-8" errors, the AI was guided to build a native Go `archive/zip` and `encoding/xml` parser to extract raw text, completely bypassing external dependencies.
- **Iterative Refinement:** Designing the state management flow in React Router to dynamically pass student profiles between components, transforming static mockups into a fully functional, data-driven Chat UI.

This project proves the ability to not just write code, but to **lead, manage, and orchestrate** advanced AI tools to build enterprise-grade applications.

---

## 🏗️ System Architecture & Technical Decisions

- **Go (Gin)**: High-performance backend with efficient concurrency handling.
- **WebSocket**: Real-time bidirectional communication for chat and notifications.
- **Dual-LLM (Groq + Gemini)**: Groq (Llama 3) for lightning-fast function calling, Gemini for massive context window analysis.
- **Cloud Database (Supabase)**: Leveraging PostgreSQL on Supabase for scalable, production-ready data storage and management.
- **Clean Architecture**: Separation of concerns (Handlers, Services, Repositories) for scalability and maintainability.

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/login`
- `POST /api/register`

### 👨‍🎓 Users
- `GET /api/users`
- `GET /api/users/:id`

### 📅 Consultations
- `GET /api/consultations`
- `POST /api/consultations`
- `PUT /api/consultations/:id`
- `DELETE /api/consultations/:id`

### 💬 Chat (WebSocket)
- `WS /api/ws/chat`

#### Example Request: `POST /api/login`
**Request Body:**
```json
{
  "username": "20010101",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "jwt_token_here",
  "role": "mahasiswa"
}
```

---

## 🔧 Installation & Setup

### Prerequisites
- **Go 1.25+**
- **Node.js & npm**
- **XAMPP / MySQL Server**: Ensure your local MySQL server is running.
- **API Keys**: Groq API & Google Gemini API.

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Get your **PostgreSQL Connection String** from the Database settings.
3. Ensure the connection string is used as the `DATABASE_URL` in your `.env` file.

### 2. Backend Setup
```bash
# Clone the project
git clone https://github.com/luckymalombeke/system-konsulku.git

# Configure Environment
cp .env.example .env 
# Edit .env and ensure DB credentials, GROQ_API_KEY, and GEMINI_API_KEY are set.

# Install dependencies and Run the engine
go mod tidy
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
