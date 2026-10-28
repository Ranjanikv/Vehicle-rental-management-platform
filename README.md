# RENT-EASE | Vehicle Rental Management System

A full-stack vehicle rental platform built with **Next.js, React, and MongoDB Atlas** that simplifies vehicle bookings, driving licence verification, rental agreements, and fleet management.

### Features
- Secure authentication with customer and admin roles
- Vehicle browsing and rental booking management
- Driving licence upload and KYC verification
- Digital rental agreements and PDF generation
- Simulated payment workflow
- Fleet maintenance tracking and admin analytics

### Tech Stack
**Next.js 16 · React 19 · JavaScript · Tailwind CSS v4 · MongoDB Atlas · Mongoose · JWT · Vercel**

### Links
- **Live Demo:** [RENT-EASE](https://vehicle-rental-management-platform.vercel.app/)
- **GitHub Repository:** [Vehicle Rental Management Platform](https://github.com/Ranjanikv/Vehicle-rental-management-platform)

## Overview

RENT-EASE is a web-based vehicle rental management system developed to simplify the interaction between customers and vehicle rental administrators.

Traditional vehicle rental operations may involve manual availability checks, document verification, booking coordination, rental agreement preparation, and maintenance tracking. RENT-EASE brings these operations into a single application with dedicated customer and administrator functionality.

Customers can browse vehicles, submit driving licence documents for verification, create bookings, review rental details, sign digital rental agreements, and access their booking information. Administrators can manage the vehicle fleet, review customer verification requests, oversee bookings, maintain vehicle maintenance records, and view operational analytics.

The application uses MongoDB Atlas for cloud-hosted database storage and Next.js App Router for both the user interface and server-side API functionality.

### Project Objectives

- Develop a full-stack vehicle rental management application.
- Implement secure authentication and role-based authorization.
- Organize vehicle inventory and availability information.
- Support driving licence document processing and administrator-led KYC review.
- Validate booking dates and prevent overlapping reservations.
- Calculate rental costs based on vehicle rates and rental duration.
- Generate rental agreements and record customer acceptance.
- Provide fleet maintenance tracking and administrative analytics.
- Deploy the application using Vercel and MongoDB Atlas.

---

## Application Architecture

RENT-EASE follows a full-stack web architecture in which the browser communicates with Next.js server-side route handlers, which implement application logic and interact with MongoDB Atlas.

```text
                   CUSTOMER / ADMIN
                          |
                          v
                    Web Browser
                          |
                          v
                 Next.js 16 Application
                 React 19 + Tailwind CSS
                          |
                          v
                  Next.js Route Handlers
                          |
             +------------+-------------+
             |            |             |
             v            v             v
       Authentication   Business     Document
       and Authorization   Logic      Processing
             |            |             |
             +------------+-------------+
                          |
              +-----------+-----------+
              |                       |
              v                       v
         MongoDB Atlas           Vercel Blob
         Application Data        Private Documents
```

### Architecture Components

- **Presentation layer:** Renders the customer-facing and administrative interfaces.
- **Application layer:** Handles authentication, authorization, validation, booking operations, and business rules.
- **Database layer:** Stores application records in MongoDB Atlas using Mongoose models.
- **Document processing layer:** Processes supported uploaded documents for OCR and verification workflows.
- **Document storage:** Uses private cloud storage for uploaded licence documents where configured.

---

## Application Workflow

### Customer Workflow

1. Open the application and browse the vehicle catalogue.
2. Register for an account or log in.
3. Upload a driving licence for verification.
4. Wait for the administrator to review the submitted document.
5. Select a vehicle and enter the rental dates after verification.
6. Review the calculated rental amount.
7. Create the booking.
8. Review and accept the rental agreement.
9. Continue through the simulated payment interface.
10. Track the booking and its status.

### Administrator Workflow

1. Log in with an authorized administrator account.
2. Access the administrative dashboard.
3. Manage vehicles and inventory information.
4. Review customer driving licence submissions.
5. Approve or reject KYC requests.
6. Monitor and manage bookings.
7. Maintain vehicle service and maintenance records.
8. Review available operational summaries and analytics.

---

## Database Design

The application uses MongoDB Atlas as its cloud database. Mongoose models represent the main entities and define how application records are structured.

| Model | Purpose |
|---|---|
| `User` | Stores customer and administrator account information, authentication-related data, and KYC status. |
| `Vehicle` | Stores vehicle details, rental rates, specifications, and availability information. |
| `Booking` | Stores customer reservations, rental dates, calculated charges, booking status, and agreement-related information. |
| `MaintenanceLog` | Records vehicle maintenance activities, dates, notes, and maintenance status. |

### Entity Relationships

- A customer can have multiple bookings.
- A vehicle can be associated with multiple bookings over time.
- Each booking references a customer and a vehicle.
- A vehicle can have multiple maintenance records.
- Customer KYC information determines whether a customer can create a booking.

These relationships are represented through document references and application-level validation.

---

## Booking Lifecycle

The application uses the following booking status values:

| Status | Meaning |
|---|---|
| `PENDING` | Booking has been created and is awaiting the next applicable step. |
| `CONFIRMED` | Booking has been confirmed. |
| `ACTIVE` | The rental is currently in progress. |
| `COMPLETED` | The rental has been completed. |
| `CANCELLED` | The booking has been cancelled. |

The intended lifecycle is:

```text
PENDING
   |
   v
CONFIRMED
   |
   v
ACTIVE
   |
   v
COMPLETED
```

A booking may transition to `CANCELLED` when cancellation is permitted by the application's rules.

The precise transition rules depend on the implemented booking and administrative workflows.

---

## Getting Started

Follow these steps to run RENT-EASE locally.

### Prerequisites

Install the following:

- Node.js compatible with the project configuration. Node.js 24 was used during development.
- npm.
- A MongoDB Atlas account and database connection string.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/Ranjanikv/Vehicle-rental-management-platform.git
cd Vehicle-rental-management-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root.

Add the required configuration:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the example values with your own credentials. See [Environment Variables](#environment-variables) for details.

### 4. Start the Development Server

```bash
npm run dev
```

Open the application in your browser:

http://localhost:3000

The application should load using the local Next.js development server.

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | Connection string for the MongoDB Atlas database. | Yes |
| `JWT_SECRET` | Secret used to sign and verify JWTs. | Yes |
| Vercel Blob token | Enables private cloud document storage where configured. | Depends on deployment configuration |

### MongoDB Atlas Configuration

1. Create a MongoDB Atlas cluster.
2. Create a database user with an appropriate password.
3. Configure network access for your development and deployment environments.
4. Copy the cluster connection string.
5. Replace the username, password, and database details as required.
6. Store the resulting URI in `.env.local`.

Ensure that special characters in database credentials are URL-encoded where necessary.

### Security Notes

- Never commit `.env.local` or other files containing secrets.
- Use strong, randomly generated JWT secrets.
- Keep storage access tokens private.
- Configure production environment variables through the hosting provider's dashboard.
- Do not expose server-only credentials through `NEXT_PUBLIC_` environment variables.

---

### Deployment Components

| Component | Platform |
|---|---|
| Web application and server-side routes | Vercel |
| Database | MongoDB Atlas |
| Private document storage | Vercel Blob, where configured |
| Source code and version control | GitHub |

### Deployment Checklist

1. Import the GitHub repository into Vercel.
2. Configure the required environment variables in the Vercel project settings.
3. Verify that MongoDB Atlas accepts connections from the deployment environment.
4. Configure private document storage credentials if required.
5. Deploy the application.
6. Test authentication, database access, vehicle browsing, KYC submission, booking creation, and administrative functionality.
7. Check deployment logs if a server-side feature fails.

**Deployment note:** Some features, particularly OCR and private document handling, may behave differently in a hosted serverless environment than on a local machine. Verify these workflows against the deployed environment rather than assuming that local success guarantees production success.

---

## Security Considerations

The project incorporates several security-related mechanisms:

- Password hashing using `bcryptjs`.
- JWT-based authentication.
- Cookie-based session handling.
- Role-based access restrictions.
- Server-side validation for application operations.
- KYC verification requirements before booking.
- Booking conflict checks.
- Private document storage where configured.

These mechanisms are intended to demonstrate practical web application security concepts. They should not be interpreted as a guarantee of production-grade security or regulatory compliance.






