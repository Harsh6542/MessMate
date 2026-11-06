# MessMate — REST API Specification & Contracts

> **Version:** 1.0  
> **Base URL:** `/api/v1`  
> **Protocol:** HTTPS / JSON REST  
> **Authentication:** Bearer token via HTTP-Only Secure Cookies (`messmate_jwt`)

---

## 1. Global API Standards & Conventions

### A. Standard Success Envelope
All successful responses return HTTP 200, 201, or 204 with the standard envelope:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "pages": 8
  }
}
```

### B. Standard Error Envelope
Errors return HTTP 4xx or 5xx with standardized debugging and user-friendly error codes:
```json
{
  "success": false,
  "error": {
    "code": "COUPON_ALREADY_REDEEMED",
    "message": "This coupon has already been redeemed today at 13:05 by Staff Member ID #60d21...",
    "details": []
  }
}
```

### C. Rate Limiting Rules
- **Public & Auth Endpoints (`/auth/*`):** 20 requests per 15-minute window per IP.
- **Coupon Scan Endpoint (`/coupons/verify`):** 60 requests per minute per authenticated staff user.
- **General API Endpoints:** 120 requests per minute per IP/Session.

---

## 2. Authentication & Profile APIs (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new student account |
| `POST` | `/auth/login` | Public | Authenticate user & set HTTP-only cookie |
| `POST` | `/auth/logout` | Authenticated | Invalidate session & clear auth cookie |
| `GET` | `/auth/me` | Authenticated | Retrieve profile details of authenticated user |
| `PUT` | `/auth/profile` | Authenticated | Update user contact number, name, or avatar |
| `PUT` | `/auth/change-password` | Authenticated | Change account password |
| `POST` | `/auth/forgot-password` | Public | Trigger password reset link to user email |
| `POST` | `/auth/reset-password/:token`| Public | Reset password using reset token |

#### Example: Login Request
`POST /api/v1/auth/login`
```json
{
  "email": "ayush.ug22.cs@nitp.ac.in",
  "password": "Password@123"
}
```
*Response Header:* `Set-Cookie: messmate_jwt=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`

---

## 3. User & Hostel Administration (`/api/v1/users`, `/api/v1/hostels`, `/api/v1/mess`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Admin, Warden | List users with filtering by role, hostel, mess |
| `POST` | `/users` | Admin | Create staff, manager, or warden account |
| `PUT` | `/users/:id/status` | Admin | Activate or deactivate user account |
| `GET` | `/hostels` | Authenticated | List all active hostel buildings |
| `POST` | `/hostels` | Admin | Create hostel facility |
| `GET` | `/mess` | Authenticated | List mess facilities |
| `PUT` | `/mess/:id/timings` | Manager, Admin | Configure meal hours and cutoffs |

---

## 4. Weekly Menu & Dish Voting (`/api/v1/menus`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/menus/today` | Authenticated | Get today's breakfast, lunch, and dinner dishes |
| `GET` | `/menus/weekly` | Authenticated | Get complete 7-day scheduled menu for student's mess |
| `POST` | `/menus` | Mess Manager | Create or update menu for a day & meal type |
| `POST` | `/menus/special` | Mess Manager | Create special holiday meal or feast |
| `POST` | `/menus/dishes/:id/vote`| Student | Vote on candidate dishes for upcoming weekend specials |

---

## 5. Absence Declaration & Meal Opt-Out (`/api/v1/declarations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/declarations` | Student | Declare absence for a single meal |
| `POST` | `/declarations/bulk` | Student | Declare absence across date range (leave) |
| `GET` | `/declarations/my` | Student | List student's own upcoming and past declarations |
| `DELETE` | `/declarations/:id` | Student | Cancel declaration (if before cutoff time) |
| `GET` | `/declarations/session/:sessionId` | Manager, Staff | Fetch all student opt-outs for a meal session |

#### Example: Single Meal Declaration
`POST /api/v1/declarations`
```json
{
  "date": "2026-11-08",
  "mealType": "dinner",
  "reason": "Attending college coding hackathon outside"
}
```

---

## 6. Digital QR Coupons & Verification (`/api/v1/coupons`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/coupons/generate` | Student | Generate cryptographic QR coupon for current active meal |
| `GET` | `/coupons/active` | Student | Retrieve existing valid coupon for current meal |
| `POST` | `/coupons/verify` | Mess Staff | Scan & redeem QR code token |
| `POST` | `/coupons/manual-verify`| Mess Staff | Fallback verification by Roll Number |

#### Example: QR Verification Request (from Staff scanner)
`POST /api/v1/coupons/verify`
```json
{
  "qrPayload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenPayload..."
}
```
*Successful Verification Response:*
```json
{
  "success": true,
  "data": {
    "student": {
      "name": "Ayush Kumar",
      "rollNumber": "2201045",
      "hostel": "Kosi Hostel",
      "avatarUrl": "https://..."
    },
    "meal": "Lunch",
    "verifiedAt": "2026-11-08T13:10:04.210Z"
  },
  "message": "Meal Verified Successfully"
}
```

---

## 7. Attendance Logs & Stats (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/attendance/my-history` | Student | Student's verified meal check-ins |
| `GET` | `/attendance/session/:id` | Manager, Staff | Real-time headcount of scanned students for session |
| `GET` | `/attendance/analytics` | Warden, Manager | Aggregated daily/weekly attendance curves |

---

## 8. Food Quality Feedback & Reviews (`/api/v1/feedback`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/feedback` | Student | Submit 5-star metric review for an attended meal |
| `GET` | `/feedback/session/:id` | Manager, Warden | View feedback scorecard for a specific meal session |
| `GET` | `/feedback/trends` | Manager, Warden | Rating trends by day of week & meal category |
| `POST` | `/feedback/:id/response`| Mess Manager | Respond to student review feedback |

#### Example: Feedback Submission
`POST /api/v1/feedback`
```json
{
  "mealSessionId": "654c82b0124...",
  "ratings": {
    "taste": 4,
    "hygiene": 5,
    "temperature": 4,
    "portionSize": 5,
    "overall": 4
  },
  "comment": "Paneer curry was fresh and hot, very good quality today."
}
```

---

## 9. Grievance & Complaint Management (`/api/v1/complaints`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/complaints` | Student | Submit complaint with category, description, and photo |
| `GET` | `/complaints` | All (Scoped) | View complaints (students view own; managers view mess) |
| `GET` | `/complaints/:id` | All (Scoped) | Get single complaint detail and timeline responses |
| `PUT` | `/complaints/:id/status`| Manager, Warden | Update workflow status (`in_progress`, `resolved`) |
| `POST` | `/complaints/:id/respond`| Manager, Warden | Add public response or internal warden note |
| `POST` | `/complaints/:id/escalate`| Warden | Escalate overdue or critical complaint |
| `POST` | `/complaints/:id/reopen` | Student | Reopen complaint if unresolved |

---

## 10. Food Wastage Monitoring (`/api/v1/waste-logs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/waste-logs` | Staff, Manager | Record physical unserved surplus and plate waste (kg) |
| `GET` | `/waste-logs` | Manager, Warden | List waste logs with date-range filters |
| `GET` | `/waste-logs/summary` | Manager, Warden | Food waste trend analysis, cost metrics & savings |

#### Example: Waste Log Entry
`POST /api/v1/waste-logs`
```json
{
  "mealSessionId": "654c82b0124...",
  "totalPreparedServings": 450,
  "totalActualServed": 412,
  "unservedSurplusWeightKg": 14.5,
  "plateWasteWeightKg": 9.2,
  "remarks": "Excess rice unserved due to sudden rainfall"
}
```

---

## 11. Inventory & Stock Management (`/api/v1/inventory`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/inventory` | Manager, Staff | List stock items, current levels, and low-stock alerts |
| `POST` | `/inventory` | Mess Manager | Create new raw material item |
| `POST` | `/inventory/transactions` | Mess Manager | Record stock purchase, kitchen consumption, or wastage |
| `GET` | `/inventory/alerts` | Mess Manager | Fetch all items currently below minimum threshold |

---

## 12. Smart Demand Prediction & Kitchen Prep Sheet (`/api/v1/demand`, `/api/v1/kitchen`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/demand/prediction/:sessionId` | Mess Manager | Forecast demand: Residents - OptOuts + Guests + Safety Buffer |
| `PUT` | `/demand/adjust-quantity/:id` | Mess Manager | Override final planned preparation count |
| `GET` | `/kitchen/prep-sheet/:id` | Staff, Manager | Display kitchen prep sheet with big numbers & ingredient estimates |

---

## 13. Guest Meals, Notifications & Announcements

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/guest-meals` | Student | Book advance meal for visiting guests/parents |
| `PUT` | `/guest-meals/:id/decision`| Mess Manager | Approve or reject guest meal booking |
| `GET` | `/notifications` | Authenticated | List in-app notifications |
| `PUT` | `/notifications/:id/read` | Authenticated | Mark notification as read |
| `GET` | `/announcements` | Authenticated | View public broadcasts |
| `POST` | `/announcements` | Manager, Warden | Post new hostel mess bulletin |
| `GET` | `/audit-logs` | Admin, Warden | View administrative activity audit trail |

