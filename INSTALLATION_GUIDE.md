# 🎓 KonsulKu - AI-Powered Academic Consultation System
## 📋 Product Installation & Setup Guide

Thank you for purchasing **KonsulKu**! This guide will walk you through setting up both the **Golang (Gin) Backend** and the **React (Vite) Frontend** on your local machine and deploying them to production (Supabase, Render/Railway, and Vercel).

---

## 🏗️ System Architecture Overview
* **Backend:** Go (Golang) 1.25+ with Gin Framework
* **Frontend:** React 18+ with Tailwind CSS (Vite Builder)
* **Database:** PostgreSQL (Cloud-ready with Supabase)
* **Real-time Engine:** WebSockets (`gorilla/websocket`)
* **AI Integration:** Groq AI API (Llama 3.3 70B for Document analysis & Llama 3.1 8B for Smart Assistant)

---

## 🛠️ Prerequisites
Before starting, ensure you have the following installed on your machine:
1. **Go (Golang)** version 1.25 or higher ([Download Go](https://go.dev/doc/install))
2. **Node.js** v18+ and **npm** ([Download Node.js](https://nodejs.org/))
3. A free **Supabase** account ([Supabase](https://supabase.com/))
4. A free **Groq** API Key ([Groq Console](https://console.groq.com/))

---

## 🗄️ Step 1: Database Setup (Supabase)
KonsulKu is built to run on cloud-native PostgreSQL provided by Supabase.

1. Log in to [Supabase](https://supabase.com/) and create a **New Project**.
2. Go to **Project Settings** > **Database**.
3. Under **Connection string**, select **URI** and copy the connection string.
   * It looks like this: `postgresql://postgres.[your-project-id]:[your-password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
   * *Make sure to replace `[your-password]` with the actual database password you created.*
4. Keep this URI ready; you will paste it into your backend `.env` file.

---

## ⚙️ Step 2: Backend Setup (Golang)

1. Open your terminal and navigate to the `/backend` folder:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file to create your active `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file in a text editor and fill in the environment variables:
   ```env
   PORT=8081
   
   # Database connection string from Supabase
   DATABASE_URL="postgresql://postgres.[your-project-id]:[your-password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
   
   # AI API Keys & Configuration (Get keys from console.groq.com)
   GROQ_API_KEY="gsk_your_groq_api_key_here"
   GROQ_API_KEY_CHAT="gsk_your_groq_api_key_here"
   GROQ_AI_MODEL="llama-3.3-70b-versatile"
   GROQ_CHAT_MODEL="llama-3.1-8b-instant"
   
   # Random long string for JWT authentication token encryption
   JWT_SECRET="your_jwt_super_secret_key_here"
   ```
4. Download the necessary Go dependencies:
   ```bash
   go mod tidy
   ```
5. Run the backend engine. On the first run, the system will **automatically run database migrations** and **seed initial dummy/demo data** to your Supabase cloud database:
   ```bash
   go run main.go
   ```
   *Your backend is now running at `http://localhost:8081`!*

---

## 💻 Step 3: Frontend Setup (React)

1. Open a new terminal and navigate to the `/frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and set the backend API URL. For local development:
   ```env
   VITE_API_URL="http://localhost:8081"
   VITE_WS_URL="ws://localhost:8081"
   ```
5. Run the frontend development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to experience the application!*

---

## 🔐 Step 4: Accessing Demo Accounts
To test all user flows, the system includes pre-seeded accounts:

| Role | Username / ID | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student (Mahasiswa)** | `20010101` | `password123` | Can submit appointments, ask the AI assistant, upload & review proposals. |
| **Lecturer (Dosen)** | `19800101` | `password123` | Can manage appointments (Accept/Reject), view stats, and chat with students in real-time. |

---

## 🚀 Step 5: Production Deployment Guide

### 1. Deploying the Backend (Render or Railway)
Because KonsulKu contains a `Dockerfile`, deploying to **Render** or **Railway** is fully automated:
1. Push your repository to **GitHub** (Private is highly recommended).
2. Go to **Render.com** > **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set the **Runtime** to `Docker` (Render automatically detects the `Dockerfile` at the root/backend folder).
5. In the **Environment** tab, add all variables from your `.env` file (`DATABASE_URL`, `GROQ_API_KEY`, `JWT_SECRET`, etc.).
6. Save and deploy. Render will give you a public URL (e.g., `https://konsulku-api.onrender.com`).

### 2. Deploying the Frontend (Vercel)
1. Go to **Vercel.com** > **Add New** > **Project**.
2. Select your repository.
3. In **Build & Development Settings**, configure:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Set to `frontend`
4. Under **Environment Variables**, add the production backend URL:
   * `VITE_API_URL` = `https://konsulku-api.onrender.com`
   * `VITE_WS_URL` = `wss://konsulku-api.onrender.com`
5. Click **Deploy**. Your app is live! 🎉

---

## 🛠️ Troubleshooting & Support
* **Database Connection Failed:** Make sure you replaced `[your-password]` in the `DATABASE_URL` with your actual Supabase DB password, and check that your local firewall does not block outgoing ports `6543`.
* **AI Responses Are Slow or Failing:** Verify that your `GROQ_API_KEY` is active and check rate limits on your Groq Console dashboard.
* **WebSocket Disconnects immediately:** Ensure that in production, you use `wss://` (secure WebSocket) instead of `ws://` in your frontend `.env`.

---
*Created by **Lucky Malombeke** | Professional Academic AI Assistant Script*
