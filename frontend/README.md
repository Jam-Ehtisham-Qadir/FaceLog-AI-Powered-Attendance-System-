# 🧠 FaceLog — AI-Powered Attendance System

> A production-ready, AI-powered attendance and payroll management system built with **Django**, **React**, **DeepFace**, and **GPT-4o Vision**.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![Django](https://img.shields.io/badge/Django-4.x-green?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![DeepFace](https://img.shields.io/badge/DeepFace-Face%20Recognition-orange?style=flat-square)
![GPT-4o](https://img.shields.io/badge/GPT--4o-Anti--Spoofing-purple?style=flat-square&logo=openai)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📌 Overview

**FaceLog** is a smart attendance management system that uses **facial recognition** to automate employee check-in and check-out. It eliminates manual attendance, prevents buddy punching, and generates automated payroll reports — all through a clean, modern web interface.

Built as a portfolio project to demonstrate real-world AI/ML engineering skills.

---

## ✨ Features

### 🎯 Core
- **5-Angle Face Registration** — guided webcam capture (straight, left, right, up, down) for robust recognition
- **Real-Time Face Recognition** — powered by DeepFace with high accuracy matching
- **Anti-Spoofing Detection** — GPT-4o Vision verifies live faces vs photos, screens, or AI-generated images
- **Duplicate Detection** — prevents re-registration of same face or same employee ID
- **Office Hours Enforcement** — check-in window 8:00 AM–1:00 PM, check-out 12:00 PM–11:59 PM

### 📊 Admin Panel
- **Protected Admin Login** — secure authentication with session persistence
- **Live Dashboard** — real-time stats with auto-refresh every 30 seconds
- **Employee Management** — search by name/ID/department, view registration photos, edit salary inline
- **Attendance Records** — month-wise filtering, pagination, search, bulk delete
- **Excel Attendance Export** — per-employee sheets with color-coded late/absent/half-day rows
- **Payroll Export** — automated salary calculation with deductions

### 💰 Payroll Logic
| Rule | Detail |
|------|--------|
| Per Day Rate | Basic Salary ÷ 30 |
| Late Arrival | Check-in after 10:15 AM → PKR 500 deduction |
| Half Day | Check-out before 6:00 PM → 50% day deduction |
| Absent | Full day deduction per absent day |
| Paid Leave | 1 free absent per month |
| Working Days | Monday – Saturday (Sunday = holiday) |

### 🖥️ Kiosk Mode
- Fullscreen employee-facing interface
- Live blinking clock
- One-tap check-in / check-out
- Separate from admin panel — no login required

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django REST Framework |
| Frontend | React 18 + Vite |
| Face Recognition | DeepFace |
| Anti-Spoofing | GPT-4o Vision (OpenAI) |
| Face Detection | face-api.js |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Excel Export | openpyxl |
| Styling | Inline React styles (dark theme) |

---

## 📁 Project Structure

```
FaceLog/
├── backend/
│   ├── api/
│   │   ├── models.py          # Employee, AttendanceRecord models
│   │   ├── views.py           # All API views
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # API routes
│   │   └── services.py        # DeepFace + GPT-4o logic
│   ├── backend/
│   │   └── settings.py
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RegisterEmployee.jsx
│   │   │   ├── EmployeeList.jsx
│   │   │   ├── AttendanceRecords.jsx
│   │   │   └── Kiosk.jsx
│   │   ├── App.jsx
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   └── AuthContext.jsx
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API Key (for anti-spoofing)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Jam-Ehtisham-Qadir/FaceLog-AI-Powered-Attendance-System-.git
cd FaceLog-AI-Powered-Attendance-System-

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
cd backend
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start backend server
python manage.py runserver
```

### Frontend Setup

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Default Admin Credentials

```
Username: admin
Password: attendai2026
```

> ⚠️ Change these in `backend/api/views.py` before deploying.

---

## 📸 Screenshots

### Landing Page
![Landing Page](screenshots/landing.png)

### Kiosk Mode
![Kiosk](screenshots/kiosk.png)

### Admin Dashboard
![Dashboard](screenshots/dashboard.png)

### Employee Management
![Employees](screenshots/employees.png)

### Attendance Records
![Records](screenshots/records.png)

### Payroll Excel Export
![Payroll](screenshots/payroll.png)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Admin login |
| GET/POST | `/api/employees/` | List / Register employees |
| DELETE | `/api/employees/<id>/` | Delete employee |
| PATCH | `/api/employees/<id>/salary/` | Update salary |
| POST | `/api/checkin/` | Face check-in |
| POST | `/api/checkout/` | Face check-out |
| GET | `/api/attendance/records/` | Paginated records |
| GET | `/api/attendance/export/` | Download attendance Excel |
| GET | `/api/attendance/export-payroll/` | Download payroll Excel |
| GET | `/api/dashboard/stats/` | Live dashboard stats |

---

## 👨‍💻 Author

**Jam Ehtisham Qadir**
Python Developer & AI/ML Engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://linkedin.com/in/jam-ehtisham-qadir-aaa691243)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?style=flat-square&logo=github)](https://github.com/Jam-Ehtisham-Qadir)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.