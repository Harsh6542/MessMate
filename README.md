# MessMate — Smart Hostel Mess Management & Food Waste Reduction System

> A production-grade MERN stack web application built to digitize college hostel mess operations, estimate meal demand in advance, eliminate avoidable food wastage, and build transparency between students, kitchen staff, mess managers, and hostel wardens.

---

## 🌟 Executive Overview & Problem Statement

In traditional collegiate hostel mess operations, three systemic inefficiencies lead to massive operational loss and student dissatisfaction:
1. **Uncertainty in Demand:** Mess authorities prepare food blindly based on total room allotment rather than actual resident presence, leading to massive over-preparation or unexpected shortages.
2. **Food Wastage without Empirical Accounting:** Kitchens guess wastage rather than measuring the critical distinction between **unserved kitchen surplus** (avoidable over-preparation) and **student plate waste** (recipe, quality, or portioning issues).
3. **Accountability Deficits:** Paper coupons and manual attendance consume valuable dining time, student quality feedback is unstructured, and hygiene grievances are difficult to escalate without fear of contractor friction.

### The MessMate Solution
**MessMate** provides a centralized platform connecting all 5 hostel stakeholders:
- **Hostel Residents (Students):** Advance meal-wise absence declarations before automated cutoffs, secure single-use QR coupons with countdown timers, attendance-gated 5-metric ratings, confidential grievance lodging with SLA deadlines, and guest meal passes.
- **Mess Workers:** Camera-based browser QR verification, offline-safe manual roll search fallback, high-contrast tablet kitchen preparation sheets with bulk raw commodity multipliers, and physical scale waste logging.
- **Mess Managers & Contractors:** Algorithmic meal demand prediction engine ($\text{Residents} - \text{OptOuts} + \text{Guests}$ with 30-day turnout factor & safety buffers), cooking quantity overrides, weekly menu publishing, raw inventory stockrooms with low-stock alerts, and guest pass management.
- **Hostel Wardens & Mess Committees:** Institutional oversight portal, student satisfaction index trends, grievance SLA resolution compliance tracking (<12h critical hygiene, <24h normal), confidential grievance investigation, and monthly food waste financial audit.
- **System Administrators:** Multi-hostel infrastructure provisioning, dining complex cutoff policies, role reassignment, and platform audit feeds.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, JavaScript (ES Modules), Tailwind CSS, React Router DOM v6, Axios, Recharts, Lucide Icons, React Hot Toast, `qrcode.react`, `html5-qrcode`, `socket.io-client` |
| **Backend** | Node.js (ES Modules), Express.js, Socket.IO, JWT Authentication with secure HTTP-only cookies, bcryptjs, Helmet, CORS, Morgan, express-rate-limit, crypto |
| **Database** | MongoDB with Mongoose ODM (compound unique indexes, schema validations, atomic operations) |
| **Architecture**| Clean modular monolith with centralized error handling (`AppError`), RBAC middleware (`authenticate`, `authorize`), and reactive WebSocket rooms |

---

## 🔑 Demo Credentials (All 5 Stakeholder Roles)

The automated seed script initializes complete accounts for all 5 roles across NIT Patna hostels:

| Role | Email | Password | Assigned Scope | Key Capabilities |
|---|---|---|---|---|
| **Super Admin** | `admin@messmate.edu` | `Password@123` | Platform-wide | Provision hostels, mess facilities, user role reassignment |
| **Hostel Warden (Boys)** | `warden@messmate.edu` | `Password@123` | Kautilya Hostel | SLA compliance tracking, confidential grievance review, waste audits |
| **Hostel Warden (Girls)**| `warden.kadambini@messmate.edu` | `Password@123` | Kadambini Hostel | Girls hostel oversight, grievance escalation & compliance tracking |
| **Mess Manager (Boys)** | `manager@messmate.edu` | `Password@123` | Kautilya Central Mess | Demand forecasting, cooking quantity approval, stock inventory, menus |
| **Mess Manager (Girls)**| `manager.kadambini@messmate.edu`| `Password@123` | Kadambini Dining Facility | Demand forecasting, menu curation, inventory receipts |
| **Mess Staff** | `staff@messmate.edu` | `Password@123` | Kautilya Kitchen Floor | QR coupon camera scanner, manual roll search, scale waste logging |
| **Student (Male - Boys)** | `student@messmate.edu` | `Password@123` | Kautilya (K-103) | Live QR coupon, absence declarations, guest meal bookings, feedback |
| **Student (Female - Girls)**| `priya.kumari@messmate.edu` | `Password@123` | Kadambini (KD-108) | Girls hostel resident testing, QR scans, meal feedback |

### 🏢 Configured Hostels & Messes
- **Kautilya Hostel (Boys)**: `H-KAUTILYA` • Kautilya Central Mess Block
- **Nagarjuna Hostel (Boys)**: `H-NAGARJUNA` • Nagarjuna Dining Hall
- **Aryabhatta Hostel (Boys)**: `H-ARYABHATTA` • Aryabhatta Food Court
- **Kadambini Hostel (Girls)**: `H-KADAMBINI` • Kadambini Dining Facility

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [MongoDB](https://www.mongodb.com/) (Local Community Server on `mongodb://localhost:27017` or MongoDB Atlas URI)

### 1. Installation
Clone or navigate to the project directory:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Verify `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/messmate_dev
JWT_SECRET=messmate_dev_jwt_secret_key_change_in_production_2026_super_secure
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_URL=http://localhost:5173
```

Verify `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Database Seeding
Populate 4 Hostels (Kautilya, Nagarjuna, Aryabhatta, Kadambini), 4 Mess Facilities, complete 7-day menus (84 slots), 30 students (18 boys, 12 girls), 7 days of historical attendance and waste scale logs, and 10 inventory commodities:
```bash
cd server
npm run seed
```

### 4. Running the Development Servers
Open two terminal windows:

**Terminal 1 (Backend API & WebSockets):**
```bash
cd server
npm run dev
# API running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend running on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser and sign in with any of the demo credentials.

---

## 🛡️ Concurrency & Anti-Tamper Architecture

### 1. Atomic QR Coupon Redemption (Zero Double-Serving)
To prevent race conditions where students attempt simultaneous coupon presentation or double scans across multiple entry turnstiles, MessMate uses an atomic database lock:
```javascript
const redeemed = await Coupon.findOneAndUpdate(
  {
    tokenHash,
    status: 'active',
    expiresAt: { $gt: new Date() }
  },
  {
    $set: {
      status: 'redeemed',
      redeemedAt: new Date(),
      redeemedBy: staffId
    }
  },
  { new: true }
);
```
**Verification Test:** Run the automated concurrency test simulating 10 simultaneous redemption requests dispatched via `Promise.all`:
```bash
cd server
npm run test:concurrency
```
*Expected Result:* Exactly **1** request succeeds (`200 OK`) and **9** requests are rejected (`400 Already Redeemed / Invalid`).

### 2. The Default-Present Policy
Students who have not explicitly submitted an absence declaration before the meal cutoff time are always treated as **demanding food by default**. A student is never assumed absent merely because they did not open the app.

### 3. Empirical Food Waste Distinction
MessMate enforces strict separation between:
- **Unserved Kitchen Surplus (kg):** Food remaining in pots and serving vessels. Directly indicates forecasting error or over-preparation.
- **Student Plate Waste (kg):** Food scraped off student plates into wash bins. Directly indicates taste, seasoning, or portioning issues.

---

## 📡 REST API Route Catalogue

### Authentication & Users (`/api/v1`)
- `POST /auth/register` — Student registration with roll number uniqueness check
- `POST /auth/login` — Issues secure HTTP-only JWT cookie
- `POST /auth/logout` — Clears JWT cookie
- `GET /auth/me` — Restores session and returns active role context
- `GET /users` — Admin / Warden user directory with role and hostel filters
- `POST /users` — Admin account provisioning (Staff, Manager, Warden, Student)
- `PUT /users/:id` — Admin hostel/mess/role reassignment
- `PUT /users/:id/status` — Account activation / suspension toggle

### Core Mess Operations (`/api/v1`)
- `GET /menus/today` — Active day menu dishes
- `GET /menus/weekly` — 7-day master menu schedule
- `POST /menus` — Manager menu creation and updates
- `GET /meal-sessions/today` — Today's breakfast, lunch, and dinner sessions
- `POST /declarations` — Student meal absence declaration
- `GET /declarations/my` — Student upcoming opt-outs list
- `DELETE /declarations/:id` — Cancel opt-out before cutoff
- `GET /coupons/current` — Generates cryptographically secure single-use QR coupon
- `POST /coupons/verify` — Staff camera scan verification (atomic)
- `POST /coupons/manual-verify` — Fallback roll number verification

### Feedback, Grievances & Real-Time (`/api/v1`)
- `POST /feedback` — Verified attendance-gated 5-metric ratings
- `GET /feedback/my` — Student rating history
- `POST /complaints` — File grievance with SLA and confidentiality toggle
- `GET /complaints` — Filterable complaint queue for Managers and Wardens
- `PUT /complaints/:id/status` — Manager response & resolution
- `PUT /complaints/:id/reopen` — Student ticket reopening
- `POST /announcements` — Broadcast emergency notices via WebSockets

### Administration & Wastage (`/api/v1`)
- `GET /demand/prep-sheet` — Kitchen batch prep sheet with raw ingredient multipliers
- `GET /demand/prediction/:sessionId` — Detailed demand prediction breakdown
- `PUT /demand/adjust-quantity/:sessionId` — Manager quantity approval
- `POST /waste-logs` — Record empirical scale weights (surplus vs plate waste)
- `GET /waste-logs/summary` — 7-day and 30-day waste and cost analytics
- `GET /inventory` — Stockroom levels with low-stock alerts
- `POST /inventory/transactions` — Record purchases, usage, and count audits
- `POST /guest-meals` — Student guest ticket reservation
- `PUT /guest-meals/:id/decision` — Manager guest ticket approval

### High-Impact Dashboards (`/api/v1/dashboard`)
- `GET /dashboard/student` — Next meal, today's dishes, coupon status, attendance rate
- `GET /dashboard/staff` — Active meal shift stats, live serving progress, recent 12 scans
- `GET /dashboard/manager` — Recharts 7-day demand vs attendance, food waste trends, quality scorecard
- `GET /dashboard/warden` — Satisfaction index trends, SLA compliance rate, confidential complaints
- `GET /dashboard/admin` — System metrics, active residents, Node.js runtime health

---

## 📚 Master Documentation Suite

Comprehensive engineering specifications are located in [`docs/`](./docs/):
- [`PROJECT_REQUIREMENTS.md`](./docs/PROJECT_REQUIREMENTS.md) — Complete 12 functional modules, edge cases, and business rules.
- [`SYSTEM_ARCHITECTURE.md`](./docs/SYSTEM_ARCHITECTURE.md) — Monolith architecture, WebSocket namespaces, and security boundary design.
- [`DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — 17 Mongoose schemas, compound indexes, and relational integrity.
- [`API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) — REST endpoint specifications, request payloads, and status codes.
- [`IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) — Phase-by-phase implementation roadmap with 100% completed deliverables.

---

## 📄 License
ISC License. Built for collegiate hostel mess management and food waste reduction.
