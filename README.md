# Smart Task Management System

[![Version](https://img.shields.io/badge/version-4.0-blue)](https://img.shields.io/badge/version-4.0-blue)
[![Status](https://img.shields.io/badge/status-production--ready-green)](https://img.shields.io/badge/status-production--ready-green)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://img.shields.io/badge/license-MIT-blue)

A modern, production-ready task management platform built with React, FastAPI, and PostgreSQL. This system features real-time updates, team collaboration, and an intuitive interface.

## Table of Contents
*   [Key Features](#key-features)
*   [Technology Stack](#technology-stack)
*   [Quick Start](#quick-start)
*   [Development Setup](#development-setup)
*   [Contributing](#contributing)
*   [License](#license)

## Key Features
*   **Task Management:** Create, update, and organize tasks with metadata.
*   **Team Collaboration:** Assign tasks and manage team members.
*   **Real-time Updates:** Instant synchronization across all clients via WebSockets.
*   **Secure Authentication:** JWT-based authentication with Supabase integration.
*   **Responsive Design:** Mobile-first approach ensures functionality on all devices.
*   **Containerized:** One-command deployment using Docker Compose.

## Technology Stack
*   **Frontend:** React 18, TypeScript, Vite, Chakra UI, TanStack Query
*   **Backend:** FastAPI, Python, SQLModel, PostgreSQL, Alembic
*   **Infrastructure:** Docker, Docker Compose, Nginx

## Quick Start
The easiest way to get the system running is with the automated deployment script.

### Prerequisites
*   Git
*   Docker & Docker Compose

### Deployment
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/smart-task.git
    cd smart-task
    ```

2.  **Run the deployment script:**
    *   **Windows:**
        ```bash
        scripts\deploy.bat
        ```
    *   **macOS / Linux:**
        ```bash
        chmod +x scripts/deploy.sh
        ./scripts/deploy.sh
        ```

This script will build Docker images, start services, and run database migrations.

### Access the Application
*   **Frontend:** `http://localhost:8086`
*   **API Documentation:** `http://localhost:9200/docs`
*   **Default Login:** `demo@example.com` / `demo123`

## Development Setup

### Prerequisites
*   Python 3.11+
*   Node.js 18+
*   Docker
*   Git

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env 
# Edit .env with your database configuration
alembic upgrade head
uvicorn app.main:app --reload --port 9200
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API configuration
npm run dev
```

For detailed instructions on manual deployment, testing, and troubleshooting, please refer to the full documentation in the `documents` directory.

## License
This project is licensed under the MIT License.