# RENT-EASE: VEHICLE RENTAL & MANAGEMENT SYSTEM
## Comprehensive Project Documentation & Technical Specification

---

## 1. Executive Summary

**RENT-EASE** is a full-stack, academic-grade **Vehicle Rental and Management System** designed using Next.js (App Router), React, Tailwind CSS, and a MySQL relational database. The application provides a complete end-to-end workflow for vehicle rental management, including customer authentication, automated driving licence OCR document validation, dynamic vehicle filtering, server-side double-booking prevention, automated rental cost calculation, digital agreement signing, and comprehensive administration controls.

---

## 2. Technology Stack & Architecture

| Layer | Component | Technology / Library |
| :--- | :--- | :--- |
| **Frontend** | Framework | Next.js 16 (App Router, Turbopack) |
| | UI Library | React 19, Tailwind CSS v4, Lucide React Icons |
| | Charts & Viz | Recharts |
| **Backend** | API Architecture | Next.js Server-side Route Handlers (`app/api/`) |
| | Authentication | JWT (`jsonwebtoken`), HTTP-only Cookies, `bcryptjs` |
| | OCR Engine | Tesseract.js (Local Document Parsing) |
| **Database** | Database Engine | MySQL Server |
| | Driver | `mysql2/promise` Connection Pool |
| | Environment | Configured via `.env.local` |

---

## 3. Implemented Modules Summary (Modules 1 – 12)

### Module 1 — Project Inspection & Architecture Setup
* Audited existing codebase and mapped architecture to local environment settings.
* Preserved existing MySQL schema without deleting, dropping, or truncating data.
* Confirmed Next.js App Router and JavaScript configuration.

### Module 2 — MySQL Connection Pool
* Configured connection pool in `lib/db.js` using `mysql2/promise` with environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
* Built database diagnostic endpoint `GET /api/test-db` executing `SELECT 1 AS result`.

### Module 3 — Authentication & Role-Based Access Control
* Password Security: Hashed with `bcryptjs` (salt rounds: 10). Plaintext passwords are never stored.
* Session Management: Signed JWT stored in HTTP-only `token` cookie (`SameSite=Lax`, `Max-Age=7 days`).
* Helper Module (`lib/auth.js`): Provides `hashPassword`, `comparePassword`, `signToken`, `verifyToken`, `requireAuth`, and `requireAdmin` server-side security guards.
* API Routes:
  * `POST /api/auth/signup`: Registers new customer with `role = 'CUSTOMER'` and `kyc_status = 'UNVERIFIED'`.
  * `POST /api/auth/login`: Authenticates credentials against MySQL `users` table and issues session cookie.
  * `POST /api/auth/logout`: Destroys session cookie.
  * `GET /api/auth/me`: Returns current authenticated user profile.
  * `POST /api/auth/seed-admin`: Populates default demo admin (`admin@vehiclerental.com` / `adminpassword123`).

### Module 4 — Customer UI Shell & Navigation
* **Navbar (`components/Navbar.js`)**: Dynamic header displaying logo, public links (Home, Vehicles, Login, Sign Up) when logged out, and customer/admin controls (Dashboard, My Bookings, Profile, Logout) when logged in.
* **Footer (`components/Footer.js`)**: Academic project footer.
* **Homepage (`app/page.js`)**: Hero section featuring headline, subtitle, interactive search box (Vehicle Type, Pickup Date, Return Date), and a 4-step *"How It Works"* workflow guide.

### Module 5 — Vehicle Management
* **Database Integration**: Connected `vehicles` table (`id`, `name`, `type`, `plate_no`, `price_per_day`, `seats`, `fuel`, `transmission`, `image`, `status`, `odometer_km`, `service_interval_km`, `last_service_km`).
* **SQL Search & Filter (`GET /api/vehicles`)**: Direct SQL filtering supporting `type`, `fuel`, `transmission`, `status`, `maxPrice`, and `search` (name or plate number).
* **Customer Catalog (`app/vehicles/page.js`)**: Responsive vehicle cards with spec badges (seats, fuel, transmission), daily rate, availability status badge (`AVAILABLE`, `RENTED`, `MAINTENANCE`), and filter sidebar.
* **Vehicle Detail View (`app/vehicles/[id]/page.js`)**: Specification breakdown, dynamic rental date picker, total days calculation, and live total cost estimation.
* **Admin Fleet Management (`app/admin/vehicles/page.js`)**: Tabular list of all fleet vehicles with status indicators, modal dialogs for adding/editing specifications, and safe vehicle deletion checks.

### Modules 6 & 7 — Driving Licence Upload & Tesseract OCR Verification
* **Local File Upload (`POST /api/kyc/upload`)**: Saves uploaded driving licence images locally under `public/uploads/licences/`.
* **OCR Parsing Engine (`lib/ocr.js`)**:
  * Scans uploaded images using `tesseract.js`.
  * Uses regex algorithms to extract Licence Number (e.g. `DL-1420110012345`), Date of Birth, Age, and Validity Period.
  * Compares customer signup name against OCR text (normalized case & whitespace matching).
  * Automatically sets customer `kyc_status = 'PENDING'` for Admin review.
* **Customer Dashboard (`app/dashboard/page.js`)**: Displays licence upload dropzone, OCR extracted data summary, and live status badges (`UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`).

### Module 8 — Admin Customer KYC Review
* **Admin Customer List (`GET /api/admin/customers`)**: Returns customer profiles, licence details, and OCR metrics.
* **Review UI (`app/admin/customers/page.js`)**: Searchable customer table with a Document Modal displaying the uploaded licence image alongside extracted OCR data.
* **KYC Decision API (`PUT /api/admin/customers/[id]/kyc`)**: Allows Admin to Approve (`VERIFIED`) or Reject (`REJECTED` with custom reason).

### Modules 9 – 12 — Booking, Double-Booking Prevention, Amount Calculation & Agreements
* **Booking Creation (`POST /api/bookings`)**:
  * Verifies customer authentication and checks `kyc_status === 'VERIFIED'`.
  * Validates date range (`start_date < end_date` and `start_date >= today`).
* **Server-Side Double-Booking Prevention**:
  * Executes conflict query before inserting any booking:
    ```sql
    SELECT id FROM bookings 
    WHERE vehicle_id = ? 
      AND status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
      AND start_date <= ? 
      AND end_date >= ?
    ```
  * Blocks overlapping bookings with HTTP 400 error.
* **Rental Amount Calculation**:
  * Calculates `numberOfDays = ceil((endDate - startDate) / 86400000)`.
  * Calculates `totalAmount = numberOfDays * price_per_day`.
  * Stores value in `bookings.total_amount`.
* **Rental Agreement & Signing (`app/bookings/[id]/page.js`)**:
  * Generates itemized legal agreement text detailing Customer info, Vehicle plate number, Rental dates, and Charges.
  * `POST /api/bookings/[id]/agreement` updates `bookings.agreement_signed = 1` and saves `agreement_text`.
* **Customer Bookings List (`app/bookings/page.js`)**: Shows list of customer bookings with status (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`) and agreement links.

---

## 4. MySQL Database Schema Reference

```sql
-- USERS TABLE
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER', 'ADMIN') DEFAULT 'CUSTOMER',
  license_no VARCHAR(50),
  license_image VARCHAR(255),
  license_name VARCHAR(100),
  license_dob DATE,
  license_valid_from DATE,
  license_valid_to DATE,
  kyc_status ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'UNVERIFIED',
  kyc_reason VARCHAR(255),
  kyc_verified_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VEHICLES TABLE
CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  plate_no VARCHAR(30) UNIQUE NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  seats INT DEFAULT 5,
  fuel VARCHAR(30) DEFAULT 'Petrol',
  transmission VARCHAR(30) DEFAULT 'Manual',
  image VARCHAR(255),
  status ENUM('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
  odometer_km INT DEFAULT 0,
  service_interval_km INT DEFAULT 10000,
  last_service_km INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  agreement_signed TINYINT(1) DEFAULT 0,
  agreement_text TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  pickup_odometer INT,
  return_odometer INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- MAINTENANCE LOGS TABLE
CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'SCHEDULED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
```

---

## 5. API Reference Table

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/test-db` | Public | Database connection pool diagnostic test |
| `POST` | `/api/auth/signup` | Public | Register customer account (`role = CUSTOMER`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue HTTP-only JWT cookie |
| `POST` | `/api/auth/logout` | Authenticated | Clear HTTP-only session cookie |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user session profile |
| `POST` | `/api/auth/seed-admin` | Public | Seed default demo admin user |
| `GET` | `/api/vehicles` | Public | List vehicles with SQL search & filter parameters |
| `POST` | `/api/vehicles` | Admin Only | Add new vehicle to fleet |
| `GET` | `/api/vehicles/[id]` | Public | Fetch detailed vehicle specification |
| `PUT` | `/api/vehicles/[id]` | Admin Only | Update vehicle specifications or status |
| `DELETE` | `/api/vehicles/[id]` | Admin Only | Delete vehicle (checks for active booking references) |
| `POST` | `/api/vehicles/seed` | Public | Seed sample fleet vehicles |
| `POST` | `/api/kyc/upload` | Customer Only | Upload licence image & run Tesseract OCR scan |
| `GET` | `/api/admin/customers` | Admin Only | List all customers with licence & OCR data |
| `PUT` | `/api/admin/customers/[id]/kyc` | Admin Only | Approve (`VERIFIED`) or Reject (`REJECTED`) KYC |
| `GET` | `/api/bookings` | Authenticated | List customer bookings (or all for Admin) |
| `POST` | `/api/bookings` | Customer Only | Create booking with double-booking check |
| `GET` | `/api/bookings/[id]` | Authenticated | Fetch single booking & generated agreement |
| `POST` | `/api/bookings/[id]/agreement` | Customer Only | Digitally sign rental agreement |

---

## 6. How to Run the Application

1. **Configure Database**:
   Ensure `.env.local` contains valid MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=YOUR_PASSWORD
   DB_NAME=vehicle_rental
   JWT_SECRET=vehicle_rental_jwt_secret_key_2026
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Demo Credentials**:
   * **Admin Account**: `admin@vehiclerental.com` / `adminpassword123`
   * **Verified Customer**: `customer@vehiclerental.com` / `customerpassword123`

---

## 7. Key Academic Viva Highlights

* **Architecture**: Monolithic Next.js App Router combining React frontend rendering with Node.js serverless route handlers and MySQL relational database.
* **Security Enforcement**: Dual-layer defense: Client-side navigation guards + Server-side token verification (`requireAdmin` / `requireAuth`) on every API endpoint.
* **Document Processing**: Asynchronous OCR scanning via Tesseract.js extracting structured text from unstructured image files.
* **Concurrency Protection**: Atomic SQL queries preventing double-booking race conditions directly at the server level.
