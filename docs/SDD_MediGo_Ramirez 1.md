




## IT342-G4
System Integration and
## Architecture

System Design Document (SDD)

Project Title: MediGo
## Prepared By: Ramirez, Ruther Gerard Lucabon

## Version: 2.2
## Date: 03/04/2026
## Status: Review


## 1



## REVISION HISTORY TABLE
## Version Date Author Changes Made Status
## 1 02/18/2026
## Ruther Gerard L.
## Ramirez
Initial draft Draft
## 2 02/25/2026
## Ruther Gerard L.
## Ramirez
Corrected domain
models, updated API
endpoints, DB, UI/UX,
and Agile sprint plan
for healthcare
booking
## Review
## 2.1 03/03/2026
## Ruther Gerard L.
## Ramirez
## Integrated Admin
doctor verification
workflow, added PRC
license tracking, and
defined Admin API
endpoints
## Review
## 2.2 03/04/2026
## Ruther Gerard L.
## Ramirez
Aligned SDD with
mandatory IT342-G4
requirements: Added
SMTP email, Google
OAuth, File Uploads,
## Sandbox Payments,
External API
integration, and
WebSockets. Added
/auth/me endpoint.
## Enforced Android
XML layouts (API 34)
and strictly prohibited
## Jetpack Compose.
## Updated Architecture
to explicitly define
## Layered Architecture
pattern.
## Review
[Date]
## Ruther Gerard L.
## Ramirez
## Revised
[Date]
## Ruther Gerard L.
## Ramirez
## Final
[Date]
## Ruther Gerard L.
## Ramirez
## Approved


## 2


## TABLE OF CONTENTS
## Contents
## EXECUTIVE SUMMARY 4

## 1.0 INTRODUCTION 5

## 2.0 FUNCTIONAL REQUIREMENTS SPECIFICATION 5

## 3.0 NON-FUNCTIONAL REQUIREMENTS 8

## 4.0 SYSTEM ARCHITECTURE 9

## 5.0 API CONTRACT & COMMUNICATION 10

## Authentication Endpoints 11
## User Registration 11
## User Login 11
## 6.0 DATABASE DESIGN 13

## 7.0 UI/UX DESIGN 14

## 8.0 PLAN 17
















## 3


## EXECUTIVE SUMMARY
## 1.1 Project Overview
MediGo is a multi-platform healthcare appointment booking system designed to
simplify how patients find doctors and clinics while enabling healthcare providers to
manage bookings efficiently. The system integrates a Spring Boot REST API, React
Web Application, and Android Mobile Application, ensuring seamless interaction across
platforms. Patients can search for verified clinics and doctors, filter by specialization
and location, book appointments, and communicate with doctors through in-system
messaging. Doctors must undergo an administrative verification process before
managing profiles, schedules, and appointments.
## 1.2 Objectives
- Develop a fully functional appointment system MVP with authentication, search
and filter, booking/cancellation, and online communication.
- Implement a robust Administrator verification workflow to ensure all registered
healthcare providers are legitimate and licensed.
- Implement a three-tier architecture using Spring Boot (backend), React (web),
and Android (mobile).
- Create RESTful APIs for communication between all system components.
- Design a responsive user interface that works consistently across web and
mobile platforms.
- Deploy all system components to production-ready environments.
## 1.3 Scope
## Included Features:
● User registration and authentication (JWT email/password and Google OAuth
## Login).
● Administrator dashboard for manual doctor verification utilizing File Uploads
(PRC ID images stored on the server and linked to the database).
● Hospital/Clinic listing integrating an External Public API (e.g., a public map or
health facility API for location data).
● Real-Time online communications between patients and doctors via
WebSockets.
## 4


● Appointment booking process featuring Sandbox Payment Gateway Integration
(Test Mode).
● Automated SMTP Email Sending for account verification and system
notifications (e.g., booking receipts).
● Responsive ReactJS web interface with protected routes.
● Android 14 (API Level 34) mobile application using XML-Based UI Layouts.
## Excluded Features:
● Jetpack Compose UI for mobile (strictly prohibited by requirements).
● Simulated/Mocked payment processing (must use a real provider's sandbox).
● Automated third-party government registry API verification (MVP uses manual
admin check with uploaded files).

## 1.0 INTRODUCTION
## 1.1 Purpose
This document serves as the comprehensive design specification for the MediGo MVP
system. It provides detailed requirements, architectural decisions, API contracts,
database design, and implementation roadmap to guide development and ensure all
components integrate seamlessly.

## 2.0 FUNCTIONAL REQUIREMENTS SPECIFICATION
## 2.1 Project Overview
Project Name: MediGo
## Domain: Healthcare
## Primary Users:
## 1. Patients
## 2. Doctors
## 3. Administrator
Problem Statement: Users (patients and doctors) need a simple, fast, and secure way
to book and receive bookings on specific verified doctors or health clinics, without the
complexity of booking personally.
## 2.2 Core User Journeys
## 5


Journey 1: New Patient Onboarding & Immediate Booking (The Happy Path)
- Entry: User downloads the Android app or visits the React web portal.
- Registration: User selects "Register as Patient," inputs email, password, and
full name. System creates an active account instantly.
- Discovery: Patient navigates to the Home Dashboard and uses the Search Bar,
filtering by "Cardiology" and selecting a specific clinic location.
- Selection: The system queries GET /doctors/search and displays only ACTIVE
(verified) cardiologists. Patient clicks on Dr. Smith's profile.
- Evaluation: Patient reviews Dr. Smith's bio, clinic details, and available calendar
slots.
- Booking: Patient selects 10:00 AM on Wednesday, chooses "Initial Check-up" as
the type, and clicks "Confirm Booking".
- Confirmation: System hits POST /appointments, successfully reserves the slot,
and redirects the patient to the "My Appointments" tab showing the new
booking as PENDING_DOCTOR_APPROVAL.
## Journey 2: Returning Patient Appointment Management & Cancellation
- Authentication: Patient logs in using existing credentials (POST /auth/login)
and receives a JWT token.
- Reviewing History: Patient navigates to "My Appointments" and views two
tabs: Upcoming and Past.
- Conflict Resolution: Patient realizes they have a scheduling conflict for an
upcoming check-up.
- Cancellation: Patient clicks the appointment, scrolls to the bottom, and selects
"Cancel Appointment".
- System Update: A warning modal appears. Upon confirmation, the system
triggers PUT /appointments/{id}/status with a CANCELLED payload.
- Notification: The appointment moves to the "Past/Cancelled" tab, and an
in-system alert is queued for the corresponding doctor.
Journey 3: Doctor Registration & Credential Submission (Friction Path)
- Registration: User selects "Register as Doctor", inputs basic credentials.
- Profile Completion: System immediately redirects the doctor to a mandatory
"Professional Profile" form.
- Data Entry: Doctor inputs their specialization, bio, associated clinic ID, and most
importantly, their PRC License Number and an image of their ID.
## 6


- Submission: Upon clicking submit, the account is flagged as
## PENDING_APPROVAL.
- Restriction: The doctor is logged into a restricted dashboard. They cannot be
found in patient searches and cannot open booking slots. A persistent banner
reads: "Your account is currently under review by an Administrator."
## Journey 4: Administrator Verification & Auditing Workflow
- Secure Login: Admin logs into the web portal with high-privilege credentials.
- Queue Monitoring: Admin navigates to the "Pending Approvals" dashboard,
which fetches GET /admin/doctors/pending.
- Auditing: Admin selects a pending doctor profile. They review the submitted
PRC License Number and visually inspect the uploaded ID image.
- External Verification: Admin manually cross-references the license number on
the official online PRC registry on a separate browser tab.
- Decision Execution: Confirming the license is valid, the Admin clicks "Approve
Account". System triggers PUT /admin/doctors/{id}/status payload to ACTIVE.
- Result: The doctor's profile is immediately pushed to the live search index for
patients to find.
## Journey 5: Doctor Daily Operations & Patient Interaction
- Start of Day: An ACTIVE verified doctor logs into the mobile app.
- Schedule Review: Navigates to the "Schedule" tab to view all appointments for
the current day.
- Appointment Management: Doctor sees a new PENDING_DOCTOR_APPROVAL
appointment requested by a patient. Doctor clicks "Accept", locking in the time
slot.
- Post-Consultation: After a patient visits the clinic physically, the doctor opens
the app, selects that specific appointment, and marks the status as
## COMPLETED.
- Record Keeping: The appointment is permanently archived in both the patient's
and doctor's history logs.
Journey 6: Cross-Role In-System Communication (Tele-Assist)
- Trigger: A patient has a booked appointment for tomorrow but is unsure if they
need to fast for a blood test.
- Initiation: Patient goes to "My Appointments", clicks the upcoming booking,
and selects "Message Doctor".
## 7


- Messaging: Patient types "Do I need to fast before coming in?" and hits send
(POST /messages).
- Reception: The doctor sees a notification badge on their "Messages" tab.
- Response: Doctor opens the active chat thread linked to that specific
appointment ID, reads the message, and replies "Yes, please fast for 8 hours
prior."
- Closure: Once the appointment status changes to COMPLETED or CANCELLED,
the system locks the chat thread to read-only for future reference.
2.3 Feature List (MoSCoW)
## MUST HAVE
- User authentication (JWT, Google OAuth login,
/me endpoint, logout).
- Role-Based Access Control (API-level and UI-level restrictions for Patient,
## Doctor, Admin).
- Admin verification dashboard with File Uploads (PRC license checks,
server-stored ID images).
- Doctor and clinic search and filter (Consuming a real External Public API for
clinic mapping/data).
- Appointment booking system (Core business module with full CRUD operations).
- Sandbox Payment Gateway integration for booking confirmation.
- In-system chat and messaging using Real-Time WebSockets.
- SMTP Email Notifications (Account welcome/verification, Booking
approval/receipt).
## SHOULD HAVE
- Appointment history for users.
- Doctor ratings or reviews.
- Basic input validation feedback.
## COULD HAVE
- Prescription attachment (File Upload).
- Basic system-wide booking statistics dashboard.
## WON'T HAVE
- Third-party automated background check integration.
- Live/Production payment processing.
- Push notifications (Mobile OS level).
- Multi-language support.
## 8


## 2.4 Detailed Feature Specifications
## Feature: User Authentication & Onboarding
● Screens: Registration (Patient/Doctor selection), License Upload (Doctor only),
## Login.
● Fields: Email, Password, Name, Role, PRC License Number.
● API Endpoints: POST /auth/register, POST /auth/login.
## Feature: Admin Verification Panel
## ● Screens: Admin Dashboard, Pending Approvals List, Verification Detail View.
● Functions: View pending doctor profiles, approve or reject applications,
suspend active accounts.
● API Endpoints: GET /admin/doctors/pending, PUT /admin/doctors/{id}/status.
## Feature: Search & Filter
## ● Screens: Home Search, Results List.
● Functions: Search by name, filter by specialization or hospital (only returns
ACTIVE doctors).
● API Endpoints: GET /doctors, GET /doctors/search?query={x}.
## Feature: Booking System
## ● Screens: Doctor Detail, Booking Form, My Appointments.
● Functions: Select time slot, choose appointment type (Check-up/Follow-up),
## Confirm.
● API Endpoints: POST /appointments, GET /appointments/{id}, PUT
## /appointments/{id}/cancel.
## Feature: Online Communication
## ● Screens: Chat Window.
● Functions: Send text message between booked patient and doctor.
● API Endpoints: POST /messages, GET /messages/{appointmentId}.
## 2.5 Acceptance Criteria
AC-1: Successful Patient Registration
➢ Given I am a new patient
➢ When I enter a valid email and strong password
➢ And I enter my full name
➢ And click "Register"
## 9


➢ Then my account should be created with the PATIENT role
➢ And I should be redirected to the login page
AC-2: Doctor Registration and Pending Status
➢ Given I am a new doctor
➢ When I enter my personal details and valid PRC license number
➢ And I upload a clear image of my PRC ID
➢ And click "Submit Registration"
➢ Then my account should be created with a PENDING_APPROVAL status
➢ And I should see a message stating my account is under review
➢ And my profile should not appear in patient search results

AC-3: Admin Approval of Doctor Account
➢ Given I am logged in as an Administrator
➢ When I navigate to the Pending Approvals dashboard
➢ And I review a pending doctor's PRC license and ID image
➢ And click the "Approve" button
➢ Then the doctor's account status should update to ACTIVE
➢ And the doctor's profile should become visible in patient search results

AC-4: Successful User Login
➢ Given I am a registered user with an active account
➢ When I enter my valid email and password
➢ And click "Login"
➢ Then I should be authenticated successfully
➢ And a JWT token should be issued
➢ And I should be redirected to my respective role dashboard

AC-5: Patient Appointment Booking
➢ Given I am logged in as a patient
➢ When I view an active doctor's available schedule
➢ And I select an available time slot
➢ And I choose the appointment type
➢ And click "Confirm Booking"
➢ Then the appointment should be saved
➢ And the selected time slot should become unavailable for other patients
➢ And the appointment should appear in my Upcoming tab

AC-6: Appointment Cancellation by Patient
➢ Given I have an upcoming booked appointment
## 10


➢ When I navigate to the appointment details
➢ And click "Cancel Appointment"
➢ And confirm the cancellation prompt
➢ Then the appointment status should update to CANCELLED
➢ And the time slot should become available again for that doctor
➢ And the appointment should move to my Past tab

AC-7: Sending an In-System Message
➢ Given I have an active booked appointment
➢ When I open the chat interface for that specific appointment
➢ And I type a message And click "Send"
➢ Then the message should appear in the chat thread immediately
➢ And the recipient should receive a notification badge on their messages tab

## 3.0 NON-FUNCTIONAL REQUIREMENTS
## 3.1 Performance Requirements
● API response time shall not exceed 2 seconds for 95% of requests.
● Web application initial page load shall not exceed 3 seconds on standard
broadband.
● Android mobile application cold start time shall not exceed 3 seconds.
● System shall support at least 100 concurrent active users.
● Database query execution time shall not exceed 500 milliseconds.

## 3.2 Security Requirements
● All client–server communication must use HTTPS (TLS 1.2 or higher).
● Authentication shall be implemented using JWT (JSON Web Tokens).
● Passwords must be hashed using bcrypt with a minimum of 12 salt rounds.
● Role-based access control (RBAC) shall be strictly enforced (Patient, Doctor,
Admin). Admin routes must reject any non-Admin token.
● Input validation shall be implemented to prevent SQL Injection.
● API rate limiting shall restrict requests to 100 requests per minute per IP.

## 3.3 Compatibility Requirements
● Web Browsers: Chrome, Firefox, Safari, Edge (latest two versions).
● Android OS: Android API Level 34 (Android 14) strictly required.
## ● Screen Sizes: Mobile (360px+), Tablet (768px+), Desktop (1024px+).
● Operating Systems: Windows 10+, macOS 10.15+, Linux Ubuntu 20.04+.


## 11


## 3.4 Usability Requirements
● First-time users should be able to complete an appointment booking within 5
minutes.
● Web application shall comply with WCAG 2.1 Level AA accessibility standards.
● Navigation structure must be consistent across all pages.
● Error messages must be clear, user-friendly, and provide recovery guidance.
● Touch targets on mobile must be at least 44x44 pixels.

## 4.0 SYSTEM ARCHITECTURE
## 4.1 Component Diagram
Note: This should be a component diagram

## 12


## Technology Stack:
● Backend: Java 17+, Spring Boot 3.x, Spring Security + JWT, Spring Data
JPA/Hibernate.
● Database: PostgreSQL 14+.
● Web Frontend: ReactJS, protected routes, consuming the Spring Boot REST
## API.
● Mobile: Android Kotlin, XML-Based UI Layouts (Jetpack Compose is NOT
allowed), Retrofit for API integration, API Level 34 (Android 14).
● Integrations: SMTP Server, External Public API, Google OAuth, Sandbox
Payment Provider (e.g., Stripe/PayMongo Test Mode), WebSockets.

## 5.0 API CONTRACT & COMMUNICATION
5.1 API Standards
Base URL https://api.medigo.com/api/v1
Format JSON for all requests/responses
Authentication Bearer token (JWT) in Authorization
header
## Response Structure {
"success": true,
## "data": {},
"error": null,
"timestamp": "2026-03-03T10:30:00Z"
## }

## 5.2 Endpoint Specifications
## Authentication Endpoints
## User Registration
## Description User Registration
API URL /auth/register
HTTP Request Method POST
Format JSON for all requests/responses
## Authentication None
## Request Payload {
## "email": <email>,
## "password": <password>,
## "firstname": <firstname>,
## "lastname": <lastname>,
## "role": <role>,
## 13


"licenseNumber":
## <license_number_if_doctor>
## }
## Response Structure {
"success": boolean,
## "data": {
## "user": {
## "email": <email>,
## "firstname": <firstname>,
## "lastname": <lastname>,
## "role": <role>
## },
"accessToken": <token>,
"refreshToken": <token>
## },
## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }
## User Login
## Description User Login
API URL /auth/login
HTTP Method POST
Format JSON for all requests/responses
## Authentication None
## Request Payload {
## “email”: <email>,
## “password”: <password>,
## }
## Response Structure {
"success": boolean,
## "data": {
## "user": {
## "email": <email>,
## "firstname": <firstname>,
## "lastname": <lastname>,
## "role": <role>
## },
"accessToken": <token>,
"refreshToken": <token>
## },
## 14


## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }

## Get Current Authenticated User
Description Retrieve the profile details and role of
the currently logged-in user
API URL /auth/me
HTTP Method GET
Format JSON for all requests/responses
Authentication Bearer token (JWT)
## Request Payload None
## Response Structure {
"success": true,
## "data": {
## "user": {
## "id": "usr-123",
## "email": "user@example.com",
"fullName": "Juan Dela Cruz",
"role": "PATIENT"
## }
## },
"error": null,
"timestamp": "2026-03-04T10:30:00Z"
## }

## Administrator Endpoints
## Get Pending Doctors
Description Retrieve a list of doctors waiting for
verification
API URL /admin/doctors/pending
HTTP Method GET
Format JSON for all requests/responses
Authentication Bearer token (JWT) - ADMIN Role
## Required
## Request Payload None
## Response Structure {
## 15


"success": boolean,
## "data": [
## {
"doctorId": <id>,
"fullName": <name>,
## "specialization": <specialization>,
"licenseNumber": <license>,
"status": "PENDING_APPROVAL"
## }
## ],
## "error": {
"code": string,
"message": string,
"details": object|null },
"timestamp": string
## }

## Update Doctor Status
Description Update the verification status of a doctor
API URL /admin/doctors/{id}/status
HTTP Method PUT
Format JSON for all requests/responses
Authentication Bearer token (JWT) - ADMIN Role
## Required
## Request Payload {
## "status":
<status_ACTIVE_or_REJECTED>,
"adminNotes": <notes>
## }
## Response Structure {
"success": boolean,
## "data": {
"doctorId": <id>,
## "status": <status>
## },
## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }

## 16


## Healthcare Provider Endpoints
## Search Doctors
Description Search by name, filter by specialization or
hospital
API URL /doctors/search?query={<keyword>}
HTTP Method GET
Format JSON for all requests/responses
Authentication Bearer token (JWT)
## Request Payload None
## Response Structure {
"success": boolean,
## "data": [
## {
"doctorId": <id>,
"fullName": <name>,
## "specialization": <specialization>,
"clinicId": <clinic_id>
## }
## ],
## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }

## Appointment Endpoints
## Create Appointment
Description Create a new booking (Patient only)
API URL /appointments
HTTP Method POST
Format JSON for all requests/responses
Authentication Bearer token (JWT) - PATIENT Role
## Required
## Request Payload {
"doctorId": <doctor_id>,
"clinicId": <clinic_id>,
"appointmentDate": <datetime>,
## "type": <appointment_type>
## }
## 17


## Response Structure {
"success": boolean,
## "data": {
"appointmentId": <id>,
"status": "PENDING" },
## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }

## Cancel Appointment
Description Update appointment status to
## CANCELLED
API URL /appointments/{id}/cancel
HTTP Method PUT
Format JSON for all requests/responses
Authentication Bearer token (JWT)
## Request Payload {
## "reason": <cancellation_reason>
## }
## Response Structure {
"success": boolean, "data": {
"appointmentId": <id>,
"status": "CANCELLED"
## },
## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }

## Messaging Endpoints
## Send Message
Description Send a text message between booked
patient and doctor
API URL /messages
## 18


HTTP Method POST
Format JSON for all requests/responses
Authentication Bearer token (JWT)
## Request Payload {
"appointmentId": <appointment_id>,
"receiverId": <user_id>,
## "content": <message_text>
## }
## Response Structure {
"success": boolean,
## "data": {
"messageId": <id>,
"sentAt": <datetime>
## },
## "error": {
"code": string,
"message": string,
"details": object|null
## },
"timestamp": string
## }

## 5.3 Error Handling
HTTP Status Codes
● 200 OK - Successful request
● 201 Created - Resource created
● 400 Bad Request - Invalid input
● 401 Unauthorized - Authentication required/failed
● 403 Forbidden - Insufficient permissions (e.g., Patient hitting Admin routes)
● 409 Conflict - Schedule conflict
● 500 Internal Server Error - Server error
## Error Code Examples

Example 1 json
## {
"success": false,
"data": null,
## "error": {
"code": "APPT-001",
"message": "Schedule conflict",
"details": "The selected time slot is no longer available."
## 19


## },
"timestamp": "2026-03-03T10:30:00Z"
## }

## Example 2 {
"success": false,
"data": null,
## "error": {
"code": "AUTH-003",
"message": "Role unauthorized",
"details": "Administrator access required."
## },
"timestamp": "2026-03-03T10:30:00Z"
## }


## Common Error Codes
● AUTH-001: Invalid credentials
● AUTH-002: Token expired
● AUTH-003: Role unauthorized for this action
● APPT-001: Schedule conflict
● APPT-002: Invalid appointment type
● DOC-001: Doctor account pending verification
● VALID-001: Validation failed
● DB-001: Resource not found
● SYS-001: Internal server error

## 6.0 DATABASE DESIGN
## 6.1 Entity Relationship Diagram
Note: This should be an ERD (Database Schema)
## 20




## Detailed Relationships:
● One-to-One: User ↔ Doctor_Profile (A user with a DOCTOR role has exactly one
profile)
● Many-to-One: Doctor_Profile → Clinic (Doctors are associated with clinics)
● One-to-Many: User (Patient) → Appointments (A patient can have multiple
appointments)
● One-to-Many: Doctor_Profile → Appointments (A doctor receives multiple
appointments)
● One-to-Many: Appointment → Messages (An appointment contains multiple
chat messages)
## 21



## Key Tables:
- users - User accounts and authentication for all roles (Patient, Doctor, Admin)
- doctor_profiles - Professional details, PRC license, and verification status
- clinics - Healthcare facilities with physical addresses and contact details
- appointments - Central transaction table linking patient, doctor, and time
- messages - In-system chat history strictly scoped to specific appointments
- refresh_tokens - JWT refresh tokens for session management

## Table Structure Summary:
● users: id, email, password_hash, full_name, role, created_at
● doctor_profiles: id, user_id, clinic_id, specialization, license_number,
prc_id_url, verification_status, bio
● clinics: id, name, address, contact_number, latitude, longitude
● appointments: id, patient_id, doctor_id, clinic_id, appointment_date, type,
status, created_at
● messages: id, appointment_id, sender_id, receiver_id, content, sent_at










## 7.0 UI/UX DESIGN
## 7.1 Web Application Wireframes
Note: This should be wireframes from Figma
Patient Homepage (Search & Discovery)
Header: [Logo] [Search Bar] [My Appointments] [User Menu]
## 22


Content: Filter bar (Specialty, Location), Doctor/Clinic Grid Cards
Each Card: Doctor Image, Name, Specialty, Clinic Name, "Book Now" button



## Doctor Detail Page
## Back Button
Doctor Profile Info (Bio, Qualifications)
Interactive Calendar for Schedule Selection
## Appointment Type Dropdown
## 23


"Confirm Booking" button






Patient Dashboard (My Appointments)
## Tabs: Upcoming, Completed, Cancelled
List of Appointments with Status Badges
## Action Buttons: Reschedule, Cancel, Message Doctor
## 24









## Doctor Registration Page
## Form Fields: Email, Password, Full Name, Specialization, Clinic
Verification Upload: PRC License Number input, PRC ID Image Upload zone
"Submit Registration" button
## 25










## Pending Approval Lock Screen
Notice: "Your account is currently under review by an Administrator."
Status: Locked profile, unavailable for booking
## 26











## Admin Verification Dashboard
## Sidebar Navigation: Dashboard, Pending Approvals, User Management
## 27


Pending Approvals View: Table of Doctors (Name, License Number, Submitted Date)
Detail Modal: Displays uploaded PRC ID, License Number input, "Approve" and "Reject"
buttons






## Chat Interface
## Sidebar: Active Appointment Chats
## 28


Main View: Chat history bubbles, Message input field, Send button









Doctor Dashboard (Schedule Management)
Header: [Logo] [Dashboard] [Appointments] [Messages] [Profile]
## 29


## Quick Stats: Total Appointments Today, Pending Requests
Main View: Vertical timeline of today's appointments
Action Buttons: Accept/Decline requests, Mark Completed







## 7.2 Mobile Application Wireframes
Note: This should be wireframes from Figma
## 30


## Mobile Bottom Navigation
(Patient) [ Home] [ Appointments] [ Messages] [ Profile]
## Mobile Bottom Navigation
(Doctor) [ Schedule] [ Requests] [ Messages] [ Profile]



















Mobile Home Screen (Patient)
## Search Bar
## Quick Categories (e.g., Dental, Cardio, General)
## 31


Horizontal scroll for Top Rated Doctors
Pull to refresh

## Mobile Booking Flow
Trigger: "Book Appointment" button on Doctor Profile
Interaction: Bottom Sheet modal for time slot selection
## 32


Step 1: Horizontal scrollable date picker
Step 2: Touch-optimized time slot grid (min 44x44px)
Step 3: Appointment type selection and "Confirm" button


## Mobile Patient Dashboard
Tabs: Upcoming, Past (Swipe gestures to switch between tabs)
List of Appointments: Doctor details with Status Badges Swipe
## 33


Actions: Swipe left to reveal Cancel button

## Mobile Doctor Daily Schedule
Home View: 1-week horizontal calendar strip, vertical daily timeline
Interaction: Tap appointment block for details (Complete/Cancel)
## 34



## Mobile Doctor Requests Screen
List View: Pending patient bookings
Action Cards: Large touch targets for "Accept" and "Decline"
## 35



## Mobile Chat Interface
Header: Active User Name and Avatar, Back button
Main View: Real-time chat layout optimized for virtual keyboards
## 36


Footer: Message input field, Send button

Mobile-Specific Features:
● Touch-optimized calendar grids and action buttons (min 44x44px)
## 37


● Gesture support (swipe to switch dashboard tabs, pull-to-refresh for doctor
lists)
● Offline caching for doctor profile images and clinic locations
● Bottom navigation for main user actions across both Patient and Doctor views
● Simplified booking forms and bottom sheet modals for easy mobile input
● Virtual keyboard-optimized layouts for the real-time chat interface
## Design System:
● Colors: Primary (#2563EB), Secondary (#7C3AED), Success (#10B981), Error
## (#EF4444)
● Typography: Inter font family, responsive sizing
● Spacing: 8px grid system
● Components: Consistent buttons (8px radius), inputs, cards, modals
● Responsive: Mobile-first approach, breakpoints at 640px, 768px, 1024px

## 8.0 PLAN
## 8.1 Project Timeline
Phase 1: Planning & Design (Week 1-2)
## Week 1: Requirements & Architecture
Day 1-2: Project setup and documentation
Day 3-4: Complete Functional and Non-Functional Requirements
Day 5-7: System architecture and tech stack finalization

## Week 2: Detailed Design
Day 1-2: API specification and contract mapping
Day 3-4: Database schema design (ERD)
Day 5-6: UI/UX wireframes for Patient, Doctor, and Admin flows
Day 7: Design Document finalization and review
## 38



Phase 2: Backend Development (Week 3-4)
## Week 3: Foundation & Security
Day 1: Spring Boot setup with dependencies
Day 2: Database configuration and entity creation
Day 3: JWT Authentication & Role-Based Access Control (RBAC)
Day 4: User management and Admin verification endpoints
Day 5: Doctor profile and Clinic CRUD operations

## Week 4: Core Booking Logic
Day 1: Appointment scheduling and slot availability logic
Day 2: Booking status management (Confirm/Cancel/Complete)
Day 3: In-system Messaging/Chat API
Day 4: Search and filtering endpoints
Day 5: API documentation (Swagger) and unit testing

Phase 3: Web Application (Week 5-6)
## Week 5: Frontend Foundation
Day 1: React setup with TypeScript and Tailwind CSS
Day 2: Authentication pages (login, register, doctor onboarding)
Day 3: Doctor Discovery and Search results page
Day 4: Doctor Profile detail view
Day 5: Booking interaction UI

## Week 6: Complete Web Features
Day 1: Patient Dashboard (My Appointments)
Day 2: Doctor Dashboard (Schedule Management)
## 39


Day 3: Admin Panel (Pending Approvals Workflow)
Day 4: Real-time Chat interface
Day 5: API integration and testing

Phase 4: Mobile Application (Week 7-8)
## Week 7: Android Foundation
Day 1: Android Studio setup and project structure
Day 2: Authentication and Profile screens
Day 3: Mobile-optimized Doctor search
Day 4: Booking flow (Bottom sheets & Calendar components)
Day 5: API service layer (Retrofit)

## Week 8: Complete Mobile App
Day 1: Appointment History and Management
Day 2: Mobile Chat UI
Day 3: UI polish, animations, and dark mode support
Day 4: Testing on emulator/device
Day 5: APK generation

Phase 5: Integration & Deployment (Week 9-10)
## Week 9: Integration Testing
Day 1: End-to-end testing across platforms
Day 2: Bug fixes and performance tuning
Day 3: Security auditing (JWT validation & SQLi checks)
Day 4: User Acceptance Testing (UAT)
Day 5: Documentation updates

## 40


## Week 10: Deployment
Day 1: Production Backend deployment (PostgreSQL + Spring Boot)
Day 2: Web App deployment (Vercel/Netlify)
Day 3: Mobile APK distribution
Day 4: Final smoke tests in production
Day 5: Project hand-off/submission
## Milestones:
● M1 (End Week 2): Design Freeze (All design documents complete)
● M2 (End Week 4): Backend API fully functional
● M3 (End Week 6): Web MVP functional (including Admin Panel)
● M4 (End Week 8): Mobile MVP functional
● M5 (End Week 10): Full system deployed and integrated
## Critical Path:
- Authentication & RBAC system (Week 3)
- Doctor verification workflow (Week 3/Week 6)
- Booking conflict logic (Week 4)
- Cross-platform API synchronization (Week 9)
## Risk Mitigation:
● Implement Database Locking: Use pessimistic or optimistic locking to prevent
"double-booking" where two patients claim the same time slot.
● Enforce RBAC: Ensure strict role separation (e.g., Doctors cannot see other
Doctors' patient lists; only Admins can approve accounts).
● Start with simplest working version: Prioritize the basic "Search and Book" flow
before adding complex features like chat.
● Test integration points early and often: Sync Android and Web apps with the
Backend API continuously from Week 3.
● Maintain strict MoSCoW adherence: Avoid scope creep by deferring
non-essential features (like payment gateways) until the core MVP is stable.
## 41



## 42
