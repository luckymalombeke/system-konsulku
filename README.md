# KonsulKu - Modern Consultation Platform 🎓💬

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**KonsulKu** is a high-performance, full-stack consultation platform designed to bridge the gap between Students (Mahasiswa) and Lecturers (Dosen). Built with a focus on real-time communication, scalability, and clean architecture.

## 🚀 Key Features

-   **Real-time Chat:** Instant messaging between students and lecturers powered by WebSockets.
-   **Appointment Management:** Seamless booking system with status tracking (Pending, Approved, Rejected, Cancelled).
-   **Smart Notifications:** Real-time push notifications for appointment updates and messages.
-   **Role-Based Access Control:** Distinct portals and functionalities for Students and Lecturers.
-   **Secure Authentication:** JWT-based authentication with Bcrypt password hashing.
-   **AI Consultation Assistant:** AI-powered guidance to help students prepare for consultations (Gemini AI Integration).
-   **Structured Logging:** Detailed system monitoring using Logrus (JSON formatted).

## 🛠️ Tech Stack

### Backend (The "Engine")
-   **Language:** Go (Golang)
-   **Framework:** Gin Gonic (High-performance HTTP web framework)
-   **ORM:** GORM (Object Relational Mapper for MySQL)
-   **Real-time:** Gorilla WebSocket
-   **Logging:** Logrus (Structured logging)
-   **Authentication:** JWT (JSON Web Token)

### Frontend (The "Interface")
-   **Library:** React.js (Vite)
-   **Styling:** CSS3 / Tailwind (Custom UI)
-   **API Client:** Native Fetch / Axios integration

## 🏗️ Architecture

This project follows the **Layered Architecture (Clean Architecture)** principle to ensure the codebase is maintainable, testable, and scalable:

1.  **Handlers:** Responsible for handling HTTP requests and responses.
2.  **Services:** Contains the core business logic.
3.  **Repositories:** Manages database interactions using the **Repository Pattern** (isolating database logic from business logic).
4.  **Models:** Defines the data structures and database schema.

## 🔧 Installation & Setup

### Prerequisites
-   Go 1.25 or higher
-   MySQL Server (XAMPP recommended for Windows)
-   Node.js & npm (for Frontend)

### Backend Setup
1.  Clone the repository.
2.  Create a MySQL database named `backend_konsulku`.
3.  Configure your environment variables in a `.env` file:
    ```env
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=backend_konsulku
    JWT_SECRET=your-secret-key
    PORT=8081
    ```
4.  Install dependencies:
    ```bash
    go mod tidy
    ```
5.  Run the application (Auto-migration will automatically create the tables):
    ```bash
    go run main.go
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend-UI-fix
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## 🔐 Demo Credentials

You can use the following accounts to test the platform. The database is automatically populated with these accounts on the first run via the built-in Seeder.

| Role | Username (ID) | Password |
| :--- | :--- | :--- |
| **Mahasiswa** | `20010101` | `password123` |
| **Dosen** | `19800101` | `password123` |

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for better academic consultation experiences.
