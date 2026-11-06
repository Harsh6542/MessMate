# MessMate — Project Requirements Document (PRD)

> **Version:** 1.0  
> **Last Updated:** November 2026  
> **Status:** Final Draft

---

## 1. Executive Summary

**Project Name:** MessMate — Smart Hostel Mess Management & Food Waste Reduction System

**Tagline:**  
*"Digitizing hostel mess operations, improving food quality and accountability, and reducing avoidable food wastage through smart meal planning and data-driven management."*

**Target Users:** Students, Mess Staff, Mess Managers/Contractors, Hostel Wardens/Mess Committees, System Administrators

**Initial Deployment:** Single college deployment (designed for NIT Patna context; no official institutional affiliation is claimed)

**Architecture:** Modular monolithic full-stack web application (MERN stack)

---

## 2. Problem Statement

In a typical Indian college hostel mess, the following problems are routinely observed:

| # | Problem | Impact |
|---|---------|--------|
| 1 | Physical mess coupons and manual attendance | Time-consuming, error-prone, paper waste |
| 2 | No advance knowledge of meal demand | Food prepared blindly, leading to surplus or shortage |
| 3 | Students leave campus without informing mess | Food prepared for absent students is wasted |
| 4 | Excess food preparation | Direct financial loss and environmental waste |
| 5 | No structured feedback channel | Student dissatisfaction goes unaddressed |
| 6 | Complaints are hard to track | Issues remain unresolved, accountability is poor |
| 7 | Reliance on manual registers | Data is unreliable, analysis is impossible |
| 8 | No timely updates to students | Menu changes, timing changes go unnoticed |
| 9 | No consolidated reporting | Wardens and committees lack decision-making data |

**Core Insight:** The fundamental disconnect is that mess authorities do not know how many students will actually eat a given meal, and students have no structured way to communicate their meal plans.

---

## 3. Solution Overview

MessMate is a centralized digital mess management platform that connects:

1. **Students** — Declare meals, generate digital coupons, submit feedback and complaints
2. **Mess Staff** — Scan coupons, verify attendance, record wastage
3. **Mess Managers/Contractors** — Plan menus, predict demand, manage inventory
4. **Wardens/Mess Committees** — Monitor performance, investigate complaints, review analytics
5. **System Administrators** — Manage users, hostels, system configuration

### Value Proposition

| Stakeholder | Key Benefit |
|-------------|-------------|
| Students | Convenience, transparency, voice in food quality |
| Mess Staff | Simpler verification, clear prep instructions |
| Mess Manager | Accurate demand data, inventory control, reduced waste |
| Warden/Committee | Data-driven oversight, complaint accountability |
| Administration | Digitized operations, audit trails, cost insights |

---

## 4. User Roles & Permissions

### 4.1 Student

| Permission | Description |
|------------|-------------|
| Self-registration | Register with college roll number, email, name |
| Profile management | View and update own profile |
| View weekly menu | See current week's breakfast, lunch, dinner |
| Meal absence declaration | Skip meals or declare leave for date ranges |
| Generate meal coupon | Get QR-based digital coupon for current meal |
| View attendance history | See past meal attendance records |
| Submit meal ratings | Rate food quality after attending a meal |
| Submit complaints | File complaints with category, description, images |
| Track complaints | View complaint status updates and responses |
| Receive notifications | Get announcements, menu updates, complaint updates |
| Request guest meals | Request meals for visitors |
| View feedback history | Review past ratings and comments |

**Restrictions:** Cannot access other students' data, cannot modify menus, cannot manage users, cannot view confidential administrative information.

### 4.2 Mess Staff

| Permission | Description |
|------------|-------------|
| Scan QR coupons | Use camera to scan student coupons |
| Verify meal eligibility | Check if a student is eligible for the current meal |
| Mark attendance | Record that a student has been served |
| Manual verification | Look up students by roll number when QR is unavailable |
| View expected counts | See how many students are expected for the current meal |
| Record wastage | Enter unserved surplus and plate waste data |
| View kitchen prep sheet | See preparation quantities and instructions |

**Restrictions:** Cannot access sensitive student personal data, cannot modify menus, cannot manage complaints (beyond viewing those assigned to them), cannot access analytics dashboards.

### 4.3 Mess Manager / Contractor

| Permission | Description |
|------------|-------------|
| Menu management | Create, update, and publish weekly menus and special meals |
| Meal session management | Configure and manage meal sessions |
| Declaration cutoffs | Set deadlines for meal opt-outs |
| View demand predictions | See expected meal counts with historical context |
| Adjust preparation quantity | Override recommended quantities |
| Inventory management | Add items, record stock movements, view alerts |
| View food quality ratings | See meal ratings and trends |
| Respond to complaints | Address assigned complaints |
| Record wastage | Enter and review food wastage data |
| Guest meal management | Approve or reject guest meal requests |
| Publish announcements | Send announcements to students |
| View attendance stats | See attendance trends and patterns |

**Restrictions:** Cannot manage users or hostels, cannot escalate complaints (warden-only), cannot access system-level configuration.

### 4.4 Hostel Warden / Mess Committee

| Permission | Description |
|------------|-------------|
| Monitor mess performance | View overall quality, attendance, and wastage dashboards |
| Monitor food quality | Review rating trends across time periods |
| Investigate complaints | View all complaints including confidential ones |
| Escalate complaints | Escalate unresolved or critical complaints |
| Review resolution times | Track complaint handling efficiency |
| Monitor wastage trends | Identify persistent wastage problems |
| Review attendance reports | Analyze demand patterns |
| Audit operations | Review administrative activity logs |
| Review manager accountability | Monitor manager responses and actions |

**Restrictions:** Cannot directly manage menus or inventory (oversight role, not operational).

### 4.5 Super Admin

| Permission | Description |
|------------|-------------|
| User management | Create, update, deactivate all user types |
| Hostel management | Create and configure hostels |
| Mess facility management | Create mess facilities, assign to hostels |
| Role assignment | Assign and modify user roles |
| System configuration | Configure meal timings, cutoffs, billing policies |
| System announcements | Publish system-wide announcements |
| System analytics | View system-level usage and health metrics |
| Audit logs | Access complete audit trail |

---

## 5. Functional Requirements

### FR-AUTH: Authentication & User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-001 | Students can register with name, email, roll number, phone, hostel, password | Must |
| FR-AUTH-002 | Users can log in with email and password | Must |
| FR-AUTH-003 | Passwords are hashed using bcrypt before storage | Must |
| FR-AUTH-004 | Authentication uses JWT stored in HTTP-only secure cookies | Must |
| FR-AUTH-005 | Frontend routes are protected based on authentication status | Must |
| FR-AUTH-006 | Backend endpoints enforce authentication via middleware | Must |
| FR-AUTH-007 | Backend endpoints enforce role-based authorization | Must |
| FR-AUTH-008 | Users can log out (cookie cleared) | Must |
| FR-AUTH-009 | Users can request a password reset via email | Should |
| FR-AUTH-010 | Users can reset their password with a valid token | Should |
| FR-AUTH-011 | Users can update their profile information | Must |
| FR-AUTH-012 | Admin can create staff, manager, and warden accounts | Must |
| FR-AUTH-013 | Each student has a unique college roll number | Must |
| FR-AUTH-014 | Students are assigned to a specific hostel | Must |
| FR-AUTH-015 | Registration policies are configurable (open, invite-only, admin-only) | Should |

### FR-COUPON: Digital Mess Coupon System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COUPON-001 | Students can generate a QR-based coupon for the current meal session | Must |
| FR-COUPON-002 | System checks student eligibility before generating coupon | Must |
| FR-COUPON-003 | Each coupon contains a unique, unpredictable, time-limited token | Must |
| FR-COUPON-004 | Coupon tokens are stored securely (hashed) in the database | Must |
| FR-COUPON-005 | A student cannot have multiple active coupons for the same meal | Must |
| FR-COUPON-006 | Staff can scan the QR code to verify and redeem the coupon | Must |
| FR-COUPON-007 | Backend validates coupon authenticity, expiration, and redemption status | Must |
| FR-COUPON-008 | Duplicate scans of a redeemed coupon are rejected with clear error | Must |
| FR-COUPON-009 | Coupon redemption is atomic (prevents race conditions) | Must |
| FR-COUPON-010 | Attendance is recorded upon successful coupon redemption | Must |
| FR-COUPON-011 | The staff member who verified is recorded in the attendance log | Must |
| FR-COUPON-012 | Coupons expire after the meal session ends | Must |
| FR-COUPON-013 | Students who declared absence cannot generate a valid coupon | Must |
| FR-COUPON-014 | Manual verification fallback exists (roll number lookup) | Must |
| FR-COUPON-015 | Coupon history is available to students | Should |

### FR-ABSENCE: Absence Declaration & Meal Opt-Out

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ABSENCE-001 | Students can skip individual meals (breakfast, lunch, dinner) | Must |
| FR-ABSENCE-002 | Students can declare absence for an entire day | Must |
| FR-ABSENCE-003 | Students can declare hostel leave for a date range | Must |
| FR-ABSENCE-004 | Students can select multiple dates and meals to skip | Must |
| FR-ABSENCE-005 | Students can view their upcoming declarations | Must |
| FR-ABSENCE-006 | Students can modify a declaration before the cutoff deadline | Must |
| FR-ABSENCE-007 | Students can cancel a declaration and restore eligibility before cutoff | Must |
| FR-ABSENCE-008 | Mess manager can configure cutoff times per meal | Must |
| FR-ABSENCE-009 | Declarations become read-only after the cutoff | Must |
| FR-ABSENCE-010 | A student with no declaration is treated as PRESENT by default | Must |
| FR-ABSENCE-011 | Duplicate declarations for the same meal are prevented | Must |
| FR-ABSENCE-012 | Administrative overrides are recorded in audit logs | Must |
| FR-ABSENCE-013 | Absence reasons are optional and not exposed to kitchen staff | Should |
| FR-ABSENCE-014 | Declarations do not automatically trigger billing changes | Must |
| FR-ABSENCE-015 | Emergency late cancellations follow a controlled process | Should |

### FR-DEMAND: Smart Meal Demand Prediction

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DEMAND-001 | System calculates expected meals = residents - opt-outs + guests | Must |
| FR-DEMAND-002 | Manager sees the declared demand before food preparation | Must |
| FR-DEMAND-003 | Dashboard shows: total residents, opt-outs, guests, expected demand | Must |
| FR-DEMAND-004 | System tracks historical actual attendance per meal type per day | Should |
| FR-DEMAND-005 | System provides historical recommendation alongside declared demand | Should |
| FR-DEMAND-006 | Manager can adjust the final preparation quantity | Must |
| FR-DEMAND-007 | A configurable safety buffer is applied to recommendations | Should |
| FR-DEMAND-008 | Historical patterns do not silently override declared requirements | Must |
| FR-DEMAND-009 | System provides decision support, not automatic food decisions | Must |

### FR-RATING: Food Quality Rating & Review

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RATING-001 | Students can rate individual meals on 5 dimensions (1-5 scale) | Must |
| FR-RATING-002 | Rating dimensions: taste, hygiene, temperature, portion size, overall | Must |
| FR-RATING-003 | Students can add written comments | Must |
| FR-RATING-004 | One review per student per meal session (enforced) | Must |
| FR-RATING-005 | Reviews are available only after meal attendance is verified | Should |
| FR-RATING-006 | Average ratings are calculated automatically | Must |
| FR-RATING-007 | Daily, weekly, and monthly quality trends are displayed | Must |
| FR-RATING-008 | Manager can respond to feedback | Should |
| FR-RATING-009 | Serious food quality issues can be flagged | Should |
| FR-RATING-010 | Reviewer identity is not publicly exposed | Must |

### FR-COMPLAINT: Complaint & Grievance Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COMPLAINT-001 | Students can submit complaints with category, description, images | Must |
| FR-COMPLAINT-002 | Categories: food quality, hygiene, quantity, undercooked/stale, staff behaviour, queues, water, infrastructure, other | Must |
| FR-COMPLAINT-003 | Each complaint gets a unique human-readable ID (e.g., CMP-2026-00001) | Must |
| FR-COMPLAINT-004 | Status workflow: submitted → assigned → under review → in progress → resolved → closed | Must |
| FR-COMPLAINT-005 | Students can track complaint status and view responses | Must |
| FR-COMPLAINT-006 | Students can reopen unresolved complaints | Must |
| FR-COMPLAINT-007 | Managers can assign complaints and add responses | Must |
| FR-COMPLAINT-008 | Internal notes (not visible to students) are supported | Should |
| FR-COMPLAINT-009 | Configurable resolution deadlines | Should |
| FR-COMPLAINT-010 | Overdue complaints are escalated automatically or manually | Should |
| FR-COMPLAINT-011 | Confidential complaints protect student identity | Should |
| FR-COMPLAINT-012 | Food safety complaints are highlighted for immediate attention | Should |
| FR-COMPLAINT-013 | Complaint statistics and recurring issues are trackable | Must |
| FR-COMPLAINT-014 | Full audit trail for complaint lifecycle | Must |

### FR-MENU: Weekly Menu Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MENU-001 | Students can view today's breakfast, lunch, and dinner | Must |
| FR-MENU-002 | Students can view the complete weekly menu | Must |
| FR-MENU-003 | Students can view upcoming special meals | Should |
| FR-MENU-004 | Managers can create and update daily menus per meal type | Must |
| FR-MENU-005 | Managers can add individual dishes with name, category, veg/non-veg | Must |
| FR-MENU-006 | Managers can update meal timings | Must |
| FR-MENU-007 | Managers can publish menu changes | Must |
| FR-MENU-008 | Allergen information can be added per dish | Should |
| FR-MENU-009 | Special/festival meal planning is supported | Should |
| FR-MENU-010 | Students can vote on suggested special dishes | Could |

### FR-WASTE: Food Wastage Monitoring

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WASTE-001 | Staff records unserved surplus food weight (kg) per meal session | Must |
| FR-WASTE-002 | Staff records plate waste weight (kg) per meal session | Must |
| FR-WASTE-003 | Staff records total meals prepared and served | Must |
| FR-WASTE-004 | Daily, weekly, monthly wastage is displayed | Must |
| FR-WASTE-005 | Meal-wise wastage comparison across days | Must |
| FR-WASTE-006 | Historical wastage trends with charts | Must |
| FR-WASTE-007 | Estimated wastage cost (where ingredient cost data exists) | Should |
| FR-WASTE-008 | Identify meals that repeatedly produce surplus | Must |
| FR-WASTE-009 | Wastage is measured independently from attendance | Must |

### FR-INVENTORY: Inventory & Stock Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-INVENTORY-001 | Managers can add inventory items (rice, oil, vegetables, etc.) | Must |
| FR-INVENTORY-002 | Record incoming stock (purchases) | Must |
| FR-INVENTORY-003 | Record consumed stock | Must |
| FR-INVENTORY-004 | View available quantities | Must |
| FR-INVENTORY-005 | Set minimum stock thresholds | Must |
| FR-INVENTORY-006 | Generate low-stock alerts | Must |
| FR-INVENTORY-007 | Maintain stock movement history | Must |
| FR-INVENTORY-008 | Record purchase details (vendor, price) | Should |
| FR-INVENTORY-009 | Generate usage reports | Should |
| FR-INVENTORY-010 | Connect meal prep estimates with ingredient requirements | Could |

### FR-GUEST: Guest Meal Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-GUEST-001 | Students can request guest meals in advance | Must |
| FR-GUEST-002 | Students select date, meal type, guest count | Must |
| FR-GUEST-003 | Managers approve or reject requests | Must |
| FR-GUEST-004 | Approved guests are included in demand calculation | Must |
| FR-GUEST-005 | Guest meals are tracked separately from resident attendance | Must |
| FR-GUEST-006 | Guest charges follow configurable policies | Should |

### FR-KITCHEN: Kitchen Preparation Sheet

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-KITCHEN-001 | Display meal name and date | Must |
| FR-KITCHEN-002 | Display expected resident meal count | Must |
| FR-KITCHEN-003 | Display approved guest meal count | Must |
| FR-KITCHEN-004 | Display total declared demand | Must |
| FR-KITCHEN-005 | Display recommended preparation quantity | Must |
| FR-KITCHEN-006 | Display manager-approved final quantity | Must |
| FR-KITCHEN-007 | Display required ingredients (where configured) | Should |
| FR-KITCHEN-008 | Mobile/tablet compatible with large readable numbers | Must |
| FR-KITCHEN-009 | Usable without technical training | Must |

### FR-NOTIFY: Notification & Announcement System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NOTIFY-001 | In-app notifications for important events | Must |
| FR-NOTIFY-002 | Real-time delivery via Socket.IO | Must |
| FR-NOTIFY-003 | Notification types: meal reminders, menu updates, complaint updates, announcements, stock alerts | Must |
| FR-NOTIFY-004 | Unread notification count | Must |
| FR-NOTIFY-005 | Mark as read / mark all read | Must |
| FR-NOTIFY-006 | Email notifications via configurable SMTP | Should |
| FR-NOTIFY-007 | Announcement creation by manager/warden/admin | Must |
| FR-NOTIFY-008 | Announcements targetable by role and hostel | Should |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-001 | Performance | API response time < 500ms for standard operations |
| NFR-002 | Performance | QR coupon verification < 2 seconds end-to-end |
| NFR-003 | Performance | Dashboard loads within 3 seconds |
| NFR-004 | Performance | Support 500+ concurrent users per hostel |
| NFR-005 | Security | Passwords hashed with bcrypt (min 12 rounds) |
| NFR-006 | Security | JWT in HTTP-only cookies (not localStorage) |
| NFR-007 | Security | Input validation on all API endpoints |
| NFR-008 | Security | Rate limiting on authentication and coupon endpoints |
| NFR-009 | Security | Protection against NoSQL injection, XSS |
| NFR-010 | Security | CORS properly configured |
| NFR-011 | Security | No secrets in frontend code or repository |
| NFR-012 | Scalability | Multi-hostel data isolation ready |
| NFR-013 | Scalability | Database indexed for common query patterns |
| NFR-014 | Usability | Mobile-first responsive design |
| NFR-015 | Usability | Student and staff portals fully functional on mobile |
| NFR-016 | Usability | Accessible forms and controls |
| NFR-017 | Reliability | Atomic coupon redemption (no double-serve) |
| NFR-018 | Reliability | Database validation and unique constraints |
| NFR-019 | Maintainability | Modular code with clear separation of concerns |
| NFR-020 | Maintainability | Documented APIs (Swagger/OpenAPI) |

---

## 7. Business Rules & Constraints

| # | Rule |
|---|------|
| BR-01 | A student who has NOT declared absence is ALWAYS considered present (default = present) |
| BR-02 | A QR coupon can be redeemed exactly once; duplicate scans are rejected |
| BR-03 | Coupons expire when the associated meal session ends |
| BR-04 | A student who has declared absence for a meal CANNOT generate a coupon for that meal |
| BR-05 | Manual verification fallback MUST exist for students without functional phones |
| BR-06 | Declaration cutoff deadlines are configurable per meal by the manager |
| BR-07 | Declarations become read-only after the cutoff passes |
| BR-08 | Food wastage is measured independently from attendance (actual weighing, not calculated) |
| BR-09 | Billing policies are configurable — absence declarations do NOT auto-trigger refunds |
| BR-10 | Complaint resolution must be fully traceable with audit trail |
| BR-11 | Guest meals are tracked and billed separately from resident meals |
| BR-12 | Demand prediction provides decision support — the manager makes the final call |
| BR-13 | Confidential complaints only reveal identity to specifically authorized authorities |
| BR-14 | All privileged administrative operations generate audit log entries |
| BR-15 | Historical attendance patterns must NOT silently override declared meal requirements |
| BR-16 | One review per student per meal session (database-enforced) |
| BR-17 | One declaration per student per meal session (database-enforced) |
| BR-18 | Users can only access data belonging to their authorized hostel/mess |

---

## 8. Assumptions & Dependencies

### Assumptions

| # | Assumption |
|---|-----------|
| A-01 | No access to the college's official SSO or student database (self-registration) |
| A-02 | Students have smartphones with browser and camera access |
| A-03 | Mess has WiFi or cellular connectivity for QR scanning |
| A-04 | The application is initially deployed for a single college |
| A-05 | No SMS or WhatsApp integration unless separately configured |
| A-06 | Mess billing policies vary between institutions and must be configurable |
| A-07 | Food wastage weighing equipment exists in the mess kitchen |

### Dependencies

| # | Dependency | Purpose |
|---|-----------|---------|
| D-01 | MongoDB (local or Atlas) | Primary database |
| D-02 | Node.js 18+ | Backend runtime |
| D-03 | SMTP server (configurable) | Email notifications and password reset |
| D-04 | Cloudinary account | Image uploads for complaints |
| D-05 | Modern browser with camera API | QR code scanning |

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Meal Session** | A specific instance of a meal (e.g., Breakfast on Nov 10, 2026) |
| **Meal Type** | One of: breakfast, lunch, dinner |
| **Declaration** | A student's advance notice that they will skip a meal |
| **Opt-Out** | Synonym for meal absence declaration |
| **Coupon** | A digital QR-code-based token that proves a student's meal eligibility |
| **Redemption** | The act of scanning and validating a coupon, marking it as used |
| **Unserved Surplus** | Prepared food that was never served to any student |
| **Plate Waste** | Food served to students but left uneaten (post-serving waste) |
| **Declared Demand** | Total residents minus opt-outs plus approved guest meals |
| **Historical Demand** | Demand estimate based on past attendance patterns |
| **Cutoff** | The deadline after which a meal declaration cannot be modified |
| **Mess Facility** | A physical kitchen/dining facility attached to one or more hostels |
| **Safety Buffer** | Extra meals prepared above predicted demand to handle walk-ins |
| **Confidential Complaint** | A complaint where the student's identity is hidden from most staff |
| **Audit Log** | A record of who did what, when, for accountability |

