# VEHICLE RENTAL & MANAGEMENT SYSTEM

## MASTER PROJECT SPECIFICATION

---

# 0. PROJECT CONTEXT

Build a complete academic **Vehicle Rental & Management System** as a local web application.

This is a college academic project.

The objective is to demonstrate:

- Full-stack web development
- MySQL database management
- Customer authentication
- Role-based access control
- Driving licence OCR/document validation
- Vehicle management
- Vehicle availability
- Booking management
- Rental agreements
- Simulated payments
- Pickup and return management
- Vehicle maintenance
- Customer dashboard
- Admin dashboard
- Analytics

The project does NOT need to be deployed.

The project does NOT need real payments.

The project does NOT need real government KYC verification.

The project should prioritize a working end-to-end system over unnecessary advanced features.

---

# 1. CRITICAL EXISTING DATABASE INSTRUCTION

## IMPORTANT

An existing MySQL database and tables have already been created.

**DO NOT recreate the database.**

**DO NOT drop existing tables.**

**DO NOT delete existing data.**

**DO NOT blindly replace the existing schema.**

Before implementing database-dependent functionality:

1. Inspect the existing database.
2. Inspect the existing tables.
3. Inspect the existing columns.
4. Identify what already exists.
5. Adapt the application to the existing schema.

Only propose schema changes if a required feature genuinely needs a missing field/table.

Any schema modification must be additive where possible.

The existing database is the source of truth.

---

# 2. CURRENT DATABASE

The database is expected to contain:

```text
vehicle_rental
```

Existing tables:

```text
users
vehicles
bookings
maintenance_logs
```

The following table can be added later:

```text
payments
```

Do NOT create the payments table during initial setup.

It will be introduced when the payment module is implemented.

---

# 3. TECHNOLOGY STACK

Use a simple stack.

## Frontend

- Next.js
- React
- JavaScript
- Tailwind CSS
- Next.js App Router

Do NOT use TypeScript.

## Backend

Use Next.js API route handlers/server-side functionality.

Do NOT create a separate Express server.

## Database

- MySQL
- mysql2

## Authentication

- bcryptjs
- JWT or secure server-side session
- HTTP-only cookies

Do NOT use:

- Firebase Auth
- Clerk
- Auth0
- Supabase Auth

unless explicitly requested later.

## OCR

Use:

- Tesseract OCR

or another simple locally runnable OCR solution.

## Charts

Use:

- Recharts

## Icons

Use:

- Lucide React

---

# 4. DEVELOPMENT PHILOSOPHY

Keep the implementation simple.

This is an academic project, not a commercial SaaS product.

Avoid:

- Microservices
- Docker
- Kubernetes
- Complex ORMs
- Excessive abstractions
- Complex state-management libraries
- Unnecessary external APIs
- Payment gateways
- Cloud infrastructure
- Complicated DevOps
- Overengineering

Prefer:

- Simple SQL queries
- Simple React components
- Server-side validation
- Reusable components where useful
- Clear folder structure
- Beginner-readable code

The student must be able to explain the project during a viva.

---

# 5. HIGH-LEVEL APPLICATION FLOW

The complete system should eventually work like this:

```text
CUSTOMER
   ↓
SIGN UP
   ↓
LOGIN
   ↓
UPLOAD DRIVING LICENCE
   ↓
OCR / DOCUMENT VALIDATION
   ↓
KYC STATUS
   ↓
BROWSE VEHICLES
   ↓
SELECT VEHICLE
   ↓
SELECT RENTAL DATES
   ↓
CHECK AVAILABILITY
   ↓
CREATE BOOKING
   ↓
RENTAL AGREEMENT
   ↓
SIMULATED PAYMENT
   ↓
BOOKING CONFIRMED
   ↓
PICKUP
   ↓
ACTIVE RENTAL
   ↓
RETURN
   ↓
MAINTENANCE CHECK
   ↓
AVAILABLE / MAINTENANCE
   ↓
ADMIN ANALYTICS
```

---

# 6. USER ROLES

There are two roles.

## CUSTOMER

Customer can:

- Register
- Login
- Logout
- Manage profile
- Upload driving licence
- View KYC status
- Browse vehicles
- Search vehicles
- Filter vehicles
- View vehicle details
- Select rental dates
- Check availability
- Create booking
- View bookings
- Accept rental agreement
- Complete simulated payment
- View payment status
- View booking history

## ADMIN

Admin can:

- Login
- Logout
- View dashboard
- Manage vehicles
- View customers
- Review KYC
- View bookings
- Approve bookings
- Manage pickup
- Manage return
- Manage maintenance
- View payment records
- View analytics

---

# 7. SECURITY RULE

Role-based access must be enforced on the server.

Do NOT rely only on hiding buttons from the frontend.

For example:

```text
/customer
```

must not be able to access:

```text
/admin
```

simply by typing the URL.

Every admin API route must verify:

```text
authenticated user
+
role === ADMIN
```

Customer booking APIs must also verify that the booking belongs to the logged-in customer where appropriate.

---

# 8. PROJECT FOLDER STRUCTURE

Use a structure similar to:

```text
vehicle-rental/
│
├── app/
│   ├── page.js
│   │
│   ├── login/
│   │   └── page.js
│   │
│   ├── signup/
│   │   └── page.js
│   │
│   ├── vehicles/
│   │   ├── page.js
│   │   └── [id]/
│   │       └── page.js
│   │
│   ├── dashboard/
│   │   └── page.js
│   │
│   ├── bookings/
│   │   └── ...
│   │
│   ├── admin/
│   │   ├── page.js
│   │   ├── vehicles/
│   │   ├── bookings/
│   │   ├── customers/
│   │   ├── maintenance/
│   │   └── analytics/
│   │
│   └── api/
│       ├── auth/
│       ├── vehicles/
│       ├── bookings/
│       ├── kyc/
│       ├── maintenance/
│       └── admin/
│
├── components/
│
├── lib/
│   ├── db.js
│   ├── auth.js
│   └── ...
│
├── public/
│
├── .env.local
├── PROJECT_SPEC.md
└── package.json
```

Do not create every folder immediately.

Create folders as modules are implemented.

---

# 9. MODULE-BY-MODULE DEVELOPMENT PLAN

The application MUST be developed in the following order.

Do not skip ahead.

---

# MODULE 1 — PROJECT INSPECTION AND SETUP

## Goal

Understand the existing project before changing anything.

## Tasks

1. Inspect the existing Next.js project.
2. Check `package.json`.
3. Check existing folders.
4. Check existing dependencies.
5. Check environment configuration.
6. Confirm Next.js App Router.
7. Confirm JavaScript rather than TypeScript.
8. Confirm Tailwind setup.
9. Do not overwrite existing working files unnecessarily.

## Database

Inspect the existing MySQL database.

Check:

```sql
SHOW TABLES;
```

Then inspect:

```sql
DESCRIBE users;
DESCRIBE vehicles;
DESCRIBE bookings;
DESCRIBE maintenance_logs;
```

Do NOT modify the database yet.

## Deliverable

A working Next.js application connected to the existing project structure.

---

# MODULE 2 — MYSQL CONNECTION

## Goal

Connect Next.js to the existing MySQL database.

Install:

```bash
npm install mysql2
```

Create:

```text
lib/db.js
```

Use environment variables.

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=vehicle_rental
```

Do NOT expose database credentials to the browser.

Create a simple server-side database test.

Example endpoint:

```text
/api/test-db
```

It should execute:

```sql
SELECT 1;
```

and return a success response.

## Deliverable

Next.js can successfully communicate with the existing MySQL database.

---

# MODULE 3 — AUTHENTICATION

## Goal

Build customer and admin authentication.

Install/use:

```text
bcryptjs
```

and a secure authentication mechanism.

## Signup

Customer signup fields:

```text
Name
Email
Password
Confirm Password
```

The customer should initially have:

```text
role = CUSTOMER
```

and:

```text
kyc_status = UNVERIFIED
```

if the existing schema supports it.

Do not assume these fields exist.

Inspect the existing schema first.

If missing, propose/add only the necessary columns.

## Password

Never store plaintext passwords.

Hash passwords using bcrypt.

## Login

Customer/admin enters:

```text
Email
Password
```

Server:

```text
Find user
↓
Compare password hash
↓
Create authenticated session
↓
Set HTTP-only cookie
```

## Logout

Destroy/clear authentication session.

## Protected routes

Customer routes require authentication.

Admin routes require:

```text
role = ADMIN
```

## Deliverable

A working:

```text
/signup
/login
/logout
```

flow.

---

# MODULE 4 — CUSTOMER UI

## Goal

Build the basic customer-facing application.

Create:

```text
/
 /login
 /signup
 /vehicles
 /dashboard
```

## Navbar

Display:

```text
RENT-EASE

Home
Vehicles

Login
Sign Up
```

After login:

```text
Dashboard
Vehicles
My Bookings
Profile
Logout
```

## Homepage

Hero:

```text
RENT YOUR RIDE.
START YOUR JOURNEY.

Find the right vehicle for your next trip.

[ Vehicle Type ]
[ Pick-up Date ]
[ Return Date ]

[ SEARCH VEHICLES ]
```

Add a small "How it works" section:

```text
1. Choose a vehicle
2. Complete verification
3. Book your dates
4. Pick up and drive
```

## Deliverable

A clean customer-facing shell.

---

# MODULE 5 — VEHICLE MANAGEMENT

## Goal

Connect vehicles to MySQL.

## Customer side

Create:

```text
/vehicles
```

Display vehicle cards containing:

- Image
- Name
- Type
- Seats
- Fuel
- Transmission
- Price/day
- Availability
- View Details

## Vehicle details

Create:

```text
/vehicles/[id]
```

Display:

- Vehicle image
- Name
- Type
- Price
- Seats
- Fuel
- Transmission
- Status
- Rental date selection

## Search/filter

Allow:

- Vehicle type
- Price
- Fuel
- Transmission
- Availability

Use SQL filtering.

Do not build a complicated search engine.

## Admin

Create vehicle management.

Admin can:

- Add
- Edit
- View
- Update
- Delete where safe

## Deliverable

Vehicles are fully connected to MySQL.

---

# MODULE 6 — DRIVING LICENCE UPLOAD

## Goal

Allow customers to upload a driving licence image.

Customer dashboard should contain:

```text
Driving Licence Verification
```

Show:

```text
Current status:
UNVERIFIED
```

Button:

```text
UPLOAD LICENCE
```

Accept common image formats.

For this academic project, local file storage is acceptable.

Do not introduce cloud storage.

---

# MODULE 7 — OCR / DOCUMENT VALIDATION

## Goal

Extract visible information from the uploaded licence.

Use Tesseract OCR.

Extract where possible:

```text
Name
Date of Birth
Licence Number
Valid From
Valid To
```

## Validation

Perform:

### Readability

Determine whether sufficient useful text was extracted.

### Licence number

Attempt to identify a licence-number-like value.

### DOB

Attempt to extract date of birth.

### Age

Calculate age.

Use a configurable minimum rental age.

Example:

```text
minimumRentalAge = 18
```

Do not present this as a legal requirement.

### Licence validity

If dates are extracted:

```text
valid_from <= today <= valid_to
```

### Name matching

Compare:

```text
signup name
```

against:

```text
OCR name
```

Normalize case and whitespace before comparison.

## Important limitation

OCR does NOT prove that the licence is genuine.

Do not describe this feature as government authentication.

Use wording such as:

```text
OCR-based Driving Licence Verification
```

or:

```text
Automated Document Validation
```

---

# MODULE 8 — KYC REVIEW

## Goal

Allow admin to review OCR results.

Possible statuses:

```text
UNVERIFIED
PENDING
VERIFIED
REJECTED
```

Flow:

```text
UNVERIFIED
↓
Upload licence
↓
OCR
↓
PENDING
↓
Admin review
↓
VERIFIED / REJECTED
```

Admin page:

```text
/admin/customers
```

Display:

```text
Customer
Licence Number
OCR Result
DOB
Age
Licence Validity
KYC Status
Actions
```

Admin actions:

```text
View
Approve
Reject
```

If rejected:

```text
Rejection reason
```

must be stored where supported by the existing schema.

---

# MODULE 9 — BOOKING

## Goal

Allow customers to rent vehicles.

Flow:

```text
Vehicle Details
↓
Select Start Date
↓
Select End Date
↓
Check Availability
↓
Create Booking
```

## Validation

Check:

```text
start date < end date
```

and:

```text
vehicle exists
```

and:

```text
vehicle can be rented
```

and:

```text
customer is authenticated
```

and, where required by project flow:

```text
customer KYC is verified
```

---

# MODULE 10 — DOUBLE-BOOKING PREVENTION

## Critical requirement

The server must prevent overlapping bookings.

For the same vehicle, check:

```text
existing.start_date <= requested_end
AND
existing.end_date >= requested_start
```

If a conflicting booking exists:

```text
Vehicle unavailable for selected dates.
```

Do NOT rely only on frontend availability checks.

The server must re-check immediately before creating the booking.

---

# MODULE 11 — BOOKING CALCULATION

Calculate:

```text
numberOfDays =
endDate - startDate
```

Then:

```text
totalAmount =
numberOfDays × pricePerDay
```

Display the calculation clearly.

Example:

```text
Vehicle:
Hyundai Creta

₹2,000/day

3 days

Total:
₹6,000
```

Store the final amount in the booking.

---

# MODULE 12 — RENTAL AGREEMENT

## Goal

Generate a simple agreement from booking/customer/vehicle data.

Display:

```text
RENTAL AGREEMENT

Customer:
[Name]

Driving Licence:
[Licence Number]

Vehicle:
[Vehicle]

Registration:
[Plate Number]

Rental Period:
[Start] - [End]

Total:
[Amount]
```

Terms:

```text
The customer confirms that the information provided
is accurate and agrees to the rental terms and
conditions.
```

Checkbox:

```text
I agree to the rental agreement.
```

Button:

```text
SIGN AGREEMENT
```

When accepted:

```text
agreement_signed = TRUE
```

and store the generated agreement text if the schema supports it.

No PDF is required.

---

# MODULE 13 — PAYMENTS

## Goal

Add simulated payment functionality.

Only start this module after booking and agreement are working.

## Database

Create the payments table at this stage if it does not already exist.

Suggested table:

```sql
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM(
        'PENDING',
        'SUCCESS',
        'FAILED',
        'REFUNDED'
    ) DEFAULT 'PENDING',
    method VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

Adapt this to the existing database if necessary.

## Payment UI

Display:

```text
Payment

Booking Amount: ₹6,000

[ Card ]
[ UPI ]

[ PAY NOW ]
```

Payment is simulated.

Do NOT use:

- Stripe
- Razorpay
- PayPal
- Real cards
- Banking APIs

When the user clicks:

```text
PAY NOW
```

create a real payment record in MySQL:

```text
status = SUCCESS
```

Then update booking:

```text
status = CONFIRMED
```

---

# MODULE 14 — CUSTOMER DASHBOARD

## Goal

Give customers one place to view their information.

Dashboard sections:

## Profile

```text
Name
Email
KYC Status
Licence Status
```

## Current booking

```text
Booking ID
Vehicle
Start Date
End Date
Amount
Status
```

## Booking history

Table:

```text
Vehicle
Dates
Amount
Status
```

## Payment

Display payment status where applicable.

---

# MODULE 15 — ADMIN DASHBOARD

## Goal

Create the main admin interface.

Layout:

```text
┌────────────┬───────────────────────────────┐
│            │                               │
│ Dashboard  │ KPI CARDS                    │
│            │                               │
│ Vehicles   │ Revenue / Booking charts     │
│            │                               │
│ Bookings   │ Fleet status                 │
│            │                               │
│ Customers  │ Recent bookings              │
│            │                               │
│ Maintenance│                               │
│            │                               │
│ Analytics  │                               │
└────────────┴───────────────────────────────┘
```

---

# MODULE 16 — ADMIN VEHICLE MANAGEMENT

Admin can:

```text
ADD VEHICLE
EDIT VEHICLE
VIEW VEHICLE
UPDATE STATUS
```

Vehicle fields depend on the existing schema.

Expected fields:

```text
Name
Type
Plate Number
Price Per Day
Seats
Fuel
Transmission
Image
Status
Odometer
Service Interval
Last Service
```

Do not assume every field already exists.

Inspect the schema first.

---

# MODULE 17 — ADMIN BOOKING MANAGEMENT

Create:

```text
/admin/bookings
```

Display:

```text
Booking ID
Customer
Vehicle
Start Date
End Date
Amount
Status
Actions
```

Possible actions:

```text
PENDING → APPROVE
CONFIRMED → PICKUP
ACTIVE → RETURN
COMPLETED → VIEW
```

Admin must not be able to perform invalid state transitions.

---

# MODULE 18 — PICKUP

When admin marks a booking as picked up:

Record:

```text
pickup_odometer
```

Then:

```text
booking.status = ACTIVE
vehicle.status = RENTED
```

Only allow this for a valid confirmed booking.

---

# MODULE 19 — RETURN

Admin marks the vehicle returned.

Record:

```text
return_odometer
```

Then:

```text
booking.status = COMPLETED
```

Calculate:

```text
distanceTravelled =
returnOdometer - pickupOdometer
```

Update the vehicle's current odometer.

---

# MODULE 20 — MAINTENANCE

## Goal

Automatically determine whether a vehicle needs maintenance.

Vehicle should have, where supported:

```text
odometer_km
service_interval_km
last_service_km
```

Calculate:

```text
distanceSinceService =
currentOdometer - lastServiceOdometer
```

If:

```text
distanceSinceService >= service_interval_km
```

flag:

```text
MAINTENANCE REQUIRED
```

Vehicle becomes:

```text
MAINTENANCE
```

Admin can create:

```text
SCHEDULED
IN_PROGRESS
COMPLETED
```

maintenance records.

After maintenance is completed:

```text
vehicle.status = AVAILABLE
```

and update the service odometer.

---

# MODULE 21 — ADMIN CUSTOMER / KYC MANAGEMENT

Create:

```text
/admin/customers
```

Display:

```text
Name
Email
Licence Number
KYC Status
```

For each customer:

```text
View Profile
View Licence
View OCR Data
Approve
Reject
```

---

# MODULE 22 — ANALYTICS

## Goal

Build a data-driven admin analytics dashboard.

Do NOT hard-code chart values.

All analytics should be calculated from MySQL.

---

## KPI 1 — Total Vehicles

```text
COUNT(vehicles)
```

---

## KPI 2 — Available Vehicles

Count vehicles where:

```text
status = AVAILABLE
```

---

## KPI 3 — Rented Vehicles

Count vehicles where:

```text
status = RENTED
```

---

## KPI 4 — Maintenance Vehicles

Count vehicles where:

```text
status = MAINTENANCE
```

---

## KPI 5 — Revenue

Revenue should come from successful payments.

Do not calculate revenue from arbitrary booking values if payment records exist.

---

## KPI 6 — Total Bookings

Count bookings.

---

# MODULE 23 — ANALYTICS CHARTS

Create:

## Revenue Over Time

Bar or line chart.

Data:

```text
month
revenue
```

## Bookings By Vehicle Type

Pie/donut chart.

Example:

```text
SUV
Sedan
Hatchback
Bike
```

## Booking Status

Chart showing:

```text
Pending
Confirmed
Active
Completed
Cancelled
```

## Fleet Status

Show:

```text
Available
Reserved
Rented
Maintenance
```

## Maintenance

Show:

```text
Scheduled
In Progress
Completed
```

## Vehicle Utilization

Calculate a simple academic utilization metric using booking/rental days.

Keep the formula clearly documented.

---

# MODULE 24 — ANALYTICS API

Create a server-side endpoint such as:

```text
/api/admin/analytics
```

Return real database aggregates.

Example response:

```json
{
  "totalVehicles": 20,
  "availableVehicles": 12,
  "rentedVehicles": 5,
  "maintenanceVehicles": 3,
  "totalBookings": 45,
  "monthlyRevenue": [],
  "bookingsByType": [],
  "bookingStatus": [],
  "fleetStatus": [],
  "maintenanceStats": [],
  "utilization": []
}
```

Do not hard-code values.

---

# MODULE 25 — UI POLISH

After all core functionality works, improve the interface.

## Customer UI

Should feel like a modern vehicle rental website.

## Admin UI

Should feel like a modern fleet-management dashboard.

Use:

- Cards
- Tables
- Status badges
- Clean forms
- Consistent spacing
- Responsive layout
- Icons
- Clear buttons

Avoid excessive:

- Animations
- Gradients
- Glass effects
- Decorative elements

Functionality comes first.

---

# MODULE 26 — ERROR HANDLING

Provide user-friendly messages.

Examples:

```text
Invalid email or password.
```

```text
Vehicle is unavailable for the selected dates.
```

```text
Please upload a clearer licence image.
```

```text
Your licence verification is pending.
```

```text
You are not authorized to access this page.
```

```text
Booking could not be created.
```

Do not display raw SQL errors to users.

Log useful errors server-side during development.

---

# MODULE 27 — VALIDATION

Validate:

## Authentication

- Email
- Password
- Required fields

## Booking

- Start date
- End date
- Vehicle
- Customer
- Availability

## KYC

- File type
- File size
- OCR output

## Admin

- Role
- Permissions

All important validation must happen server-side.

---

# MODULE 28 — DATABASE SAFETY

Use parameterized SQL.

Good:

```javascript
const [rows] = await pool.query(
  "SELECT * FROM users WHERE email = ?",
  [email]
);
```

Do NOT build SQL using string concatenation.

Bad:

```javascript
"SELECT * FROM users WHERE email = '" + email + "'"
```

---

# MODULE 29 — ENVIRONMENT VARIABLES

Use:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=vehicle_rental
JWT_SECRET=YOUR_SECRET
```

Never expose these values to the frontend.

Never commit `.env.local`.

Ensure:

```text
.env.local
```

is in `.gitignore`.

---

# MODULE 30 — SAMPLE DATA

If the existing database already contains data:

**Do not overwrite it.**

If sample data is needed and the tables are empty, create fictional sample data.

Recommended:

```text
8–12 vehicles
1 admin
```

Use fictional information only.

Admin example:

```text
Email:
admin@example.com
```

Do not hard-code plaintext passwords into production-like code.

---

# MODULE 31 — TESTING

Test every module before moving forward.

---

## AUTH TEST

```text
Signup
↓
Login
↓
Dashboard
↓
Logout
```

Test incorrect password.

Test duplicate email.

---

## ADMIN TEST

```text
Admin Login
↓
Admin Dashboard
↓
Admin-only page
```

Then attempt to access admin page as customer.

It must be blocked.

---

## KYC TEST

Test:

```text
Clear licence image
```

and:

```text
Blurry/unreadable image
```

Make sure the system handles OCR failure gracefully.

---

## BOOKING TEST

Test:

```text
Vehicle available
↓
Booking succeeds
```

Then:

```text
Same vehicle
+
overlapping dates
↓
Booking blocked
```

---

## PAYMENT TEST

Test:

```text
Booking
↓
Agreement
↓
Payment
↓
SUCCESS
↓
Booking CONFIRMED
```

Verify payment record exists in MySQL.

---

## PICKUP TEST

```text
CONFIRMED
↓
PICKUP
↓
ACTIVE
```

Vehicle:

```text
RENTED
```

---

## RETURN TEST

```text
ACTIVE
↓
RETURN
↓
COMPLETED
```

Vehicle odometer updates.

---

## MAINTENANCE TEST

Force the odometer above the service interval.

Verify:

```text
MAINTENANCE REQUIRED
```

---

## ANALYTICS TEST

Create sample bookings/payments.

Verify charts update based on actual database data.

---

# MODULE 32 — FINAL CUSTOMER JOURNEY

The following complete flow must work:

```text
OPEN WEBSITE
      ↓
SIGN UP
      ↓
LOGIN
      ↓
CUSTOMER DASHBOARD
      ↓
UPLOAD LICENCE
      ↓
OCR VALIDATION
      ↓
KYC REVIEW
      ↓
BROWSE VEHICLES
      ↓
SELECT VEHICLE
      ↓
SELECT DATES
      ↓
CHECK AVAILABILITY
      ↓
CREATE BOOKING
      ↓
RENTAL AGREEMENT
      ↓
SIGN AGREEMENT
      ↓
SIMULATED PAYMENT
      ↓
BOOKING CONFIRMED
      ↓
ADMIN PICKUP
      ↓
ACTIVE RENTAL
      ↓
ADMIN RETURN
      ↓
COMPLETED
      ↓
MAINTENANCE CHECK
      ↓
VEHICLE AVAILABLE / MAINTENANCE
```

---

# MODULE 33 — FINAL ADMIN JOURNEY

```text
ADMIN LOGIN
      ↓
ADMIN DASHBOARD
      ↓
VIEW KPIs
      ↓
MANAGE VEHICLES
      ↓
REVIEW CUSTOMERS
      ↓
REVIEW KYC
      ↓
MANAGE BOOKINGS
      ↓
PICKUP
      ↓
RETURN
      ↓
MAINTENANCE
      ↓
ANALYTICS
```

---

# MODULE 34 — FINAL ACCEPTANCE CHECKLIST

The project is complete when the following work.

## Authentication

- [ ] Customer signup
- [ ] Customer login
- [ ] Customer logout
- [ ] Admin login
- [ ] Password hashing
- [ ] Protected routes
- [ ] Role-based access

## KYC

- [ ] Licence upload
- [ ] OCR
- [ ] Name extraction
- [ ] DOB extraction
- [ ] Licence number extraction
- [ ] Basic readability check
- [ ] Age validation
- [ ] Licence validity check where data is available
- [ ] Admin KYC review
- [ ] KYC status

## Vehicles

- [ ] Vehicle listing
- [ ] Vehicle details
- [ ] Search
- [ ] Filtering
- [ ] Admin add vehicle
- [ ] Admin edit vehicle
- [ ] Vehicle status

## Booking

- [ ] Date selection
- [ ] Availability check
- [ ] Double-booking prevention
- [ ] Booking creation
- [ ] Booking status
- [ ] Booking history

## Agreement

- [ ] Agreement generation
- [ ] Agreement acceptance
- [ ] Agreement storage

## Payment

- [ ] Payment table
- [ ] Payment UI
- [ ] Simulated payment
- [ ] Payment record
- [ ] Booking confirmation

## Rental lifecycle

- [ ] Pickup
- [ ] Pickup odometer
- [ ] Return
- [ ] Return odometer
- [ ] Distance calculation

## Maintenance

- [ ] Maintenance detection
- [ ] Maintenance logs
- [ ] Maintenance status
- [ ] Service completion

## Dashboards

- [ ] Customer dashboard
- [ ] Admin dashboard
- [ ] Fleet status
- [ ] Booking overview
- [ ] Customer/KYC overview

## Analytics

- [ ] Total vehicles
- [ ] Available vehicles
- [ ] Rented vehicles
- [ ] Maintenance vehicles
- [ ] Revenue
- [ ] Booking trends
- [ ] Vehicle type distribution
- [ ] Booking status
- [ ] Fleet status
- [ ] Maintenance statistics
- [ ] Utilization

---

# MODULE 35 — PRIORITY IF TIME IS LIMITED

This project has a short academic deadline.

If time becomes limited, implement in this priority order.

## PRIORITY 1 — MUST WORK

```text
MySQL
Authentication
Vehicles
Booking
Availability
Admin
Pickup
Return
Maintenance
Basic Analytics
```

## PRIORITY 2

```text
Licence OCR
KYC
Rental Agreement
Simulated Payment
```

## PRIORITY 3

```text
Advanced filtering
Advanced analytics
Extra UI animations
Additional profile features
```

Do not sacrifice the core rental lifecycle to add decorative features.

---

# MODULE 36 — RULES FOR THE AI CODING AGENT

Antigravity must follow these rules.

## Rule 1 — Inspect first

Before modifying the project:

- Inspect files.
- Inspect package.json.
- Inspect database configuration.
- Inspect existing schema.

## Rule 2 — Existing database is protected

Never:

```text
DROP DATABASE
DROP TABLE
TRUNCATE
```

unless explicitly instructed by the user.

Never overwrite existing data.

## Rule 3 — Build incrementally

Implement one module at a time.

After completing a module:

1. Run the application.
2. Test the module.
3. Fix errors.
4. Only then continue.

## Rule 4 — Do not overengineer

Use the simplest solution that works.

## Rule 5 — Do not invent missing requirements

If something is unclear, choose the simplest implementation consistent with this specification.

## Rule 6 — Preserve working code

Do not rewrite working modules unnecessarily.

## Rule 7 — Database first

When a feature requires database data:

```text
Database
↓
API/server logic
↓
Frontend
```

Do not fake database results.

## Rule 8 — Real analytics

Analytics must come from real MySQL data.

## Rule 9 — Real authentication

Do not simulate authentication.

## Rule 10 — Simulated payment

Payment may be simulated, but the database record must be real.

## Rule 11 — OCR limitations

Do not claim OCR proves document authenticity.

## Rule 12 — Academic simplicity

The student must be able to explain every major component.

---

# MODULE 37 — DEVELOPMENT CHECKPOINTS

Antigravity should stop after each major checkpoint and verify the application.

## CHECKPOINT 1

```text
Next.js
+
MySQL
```

must work.

## CHECKPOINT 2

```text
Signup
+
Login
+
Logout
```

must work.

## CHECKPOINT 3

```text
Vehicles
+
Vehicle details
```

must work.

## CHECKPOINT 4

```text
Licence upload
+
OCR
+
KYC
```

must work.

## CHECKPOINT 5

```text
Booking
+
Availability
```

must work.

## CHECKPOINT 6

```text
Agreement
+
Payment
```

must work.

## CHECKPOINT 7

```text
Pickup
+
Return
+
Maintenance
```

must work.

## CHECKPOINT 8

```text
Customer Dashboard
+
Admin Dashboard
+
Analytics
```

must work.

---

# MODULE 38 — FINAL PROJECT OBJECTIVE

The final application should demonstrate a complete vehicle rental lifecycle using:

```text
Next.js
React
JavaScript
Tailwind CSS
MySQL
mysql2
bcrypt
JWT/session authentication
Tesseract OCR
Recharts
```

The system should demonstrate:

```text
AUTHENTICATION
       +
DOCUMENT VALIDATION
       +
VEHICLE MANAGEMENT
       +
BOOKING MANAGEMENT
       +
RENTAL AGREEMENT
       +
SIMULATED PAYMENT
       +
PICKUP / RETURN
       +
MAINTENANCE
       +
ANALYTICS
```

The final product should be:

- Functional
- Easy to understand
- Visually polished
- Database-backed
- Locally runnable
- Suitable for academic demonstration
- Simple enough for the student to explain in a viva

---

# STARTING INSTRUCTION

When beginning implementation:

**DO NOT immediately build the entire application.**

First:

1. Inspect the current project.
2. Inspect the existing MySQL database.
3. Inspect the existing tables.
4. Report what already exists.
5. Identify any missing fields required by Module 1.
6. Do not modify existing data.
7. Implement Module 1 only.
8. Test it.
9. Then proceed to Module 2.

Continue module by module according to this specification.