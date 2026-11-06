# MessMate — Smart Hostel Mess Management & Food Waste Reduction System

> A production-grade MERN stack web application designed to digitize college hostel mess operations, estimate meal demand in advance, minimize avoidable food wastage, and build accountability between students, kitchen staff, mess managers, and hostel wardens.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [MongoDB](https://www.mongodb.com/) (Local Community Server running on `mongodb://localhost:27017` or a MongoDB Atlas connection string)

### 1. Installation
Clone or navigate to the workspace directory and install dependencies:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create or review the `.env` file in `/server`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/messmate_dev
JWT_SECRET=messmate_dev_jwt_secret_key_change_in_production_2026_super_secure
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_URL=http://localhost:5173
```

### 3. Seed Sample Database Records
Populate sample Hostels, Dining Blocks, and pre-configured accounts for all 5 roles:
```bash
cd server
npm run seed
```

#### Pre-Configured Demo Accounts:
| Role | Email | Password | Details |
|---|---|---|---|
| **Super Admin** | `admin@messmate.edu` | `Password@123` | System Administrator |
| **Hostel Warden** | `warden@messmate.edu` | `Password@123` | Warden, Kosi Hostel |
| **Mess Manager** | `manager@messmate.edu` | `Password@123` | Contractor, Kosi Central Mess |
| **Mess Staff** | `staff@messmate.edu` | `Password@123` | QR Scanner & Kitchen Staff |
| **Student** | `student@messmate.edu` | `Password@123` | Roll No: `2201045` |

### 4. Running the Application
Open two terminal tabs:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📚 Project Documentation
Comprehensive architectural and functional design documentation is maintained in [`docs/`](./docs/):
- [`PROJECT_REQUIREMENTS.md`](./docs/PROJECT_REQUIREMENTS.md): 12 Functional Modules & Business Rules
- [`SYSTEM_ARCHITECTURE.md`](./docs/SYSTEM_ARCHITECTURE.md): MERN Monolith, Security & Concurrency Design
- [`DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md): Complete 17 Mongoose Collections & Index Design
- [`API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md): REST Endpoint Specifications & Response Formats
- [`IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md): Phase-wise Execution Roadmap & Acceptance Gates

---

## 🛠️ Technology Stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, React Hook Form, Lucide Icons, React Hot Toast
- **Backend:** Node.js, Express.js (ES Modules), Mongoose ODM, JWT (HTTP-only cookies), bcryptjs, Helmet, CORS, express-validator, express-rate-limit
- **Database:** MongoDB

