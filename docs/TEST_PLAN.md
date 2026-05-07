# MediGo Software Test Plan

**Project:** MediGo — Multi-Platform Healthcare Application  
**Version:** 1.0  
**Date:** May 6, 2026  
**Prepared by:** Group 4

---

## 1. Introduction

### 1.1 Project Overview
MediGo is a multi-platform healthcare application consisting of:
- **Backend:** Spring Boot REST API with JWT authentication and Google OAuth2
- **Web Frontend:** React SPA with role-based routing
- **Mobile App:** Android (Kotlin) with Retrofit HTTP client

### 1.2 Scope
This test plan covers all functional and non-functional testing for the MediGo application across all three platforms. It includes unit tests, integration tests, and end-to-end (E2E) tests for the following features:
- Authentication (registration, login, logout, Google OAuth2, JWT)
- Appointments (create, update, cancel, delete, status management)
- Chat (messaging between patients and doctors)
- Doctor Profile (creation, update, schedule management)
- Admin (doctor verification)
- Role-based access control (PATIENT, DOCTOR, ADMIN)

### 1.3 Objectives
1. Verify all functional requirements are correctly implemented
2. Ensure security controls (JWT, role-based access) function correctly
3. Validate data integrity across all CRUD operations
4. Confirm error handling returns appropriate HTTP status codes and messages
5. Ensure the vertical slice refactoring did not introduce regressions

---

## 2. Features to be Tested

| Feature | Description |
|---------|-------------|
| User Registration | Email/password and Google OAuth2 registration for PATIENT and DOCTOR roles |
| User Login | Email/password login and Google OAuth2 login with JWT issuance |
| JWT Token Handling | Token validation, expiry, blacklisting on logout |
| Logout | Token revocation and session clearing |
| Appointment Creation | Patient books appointment with a verified doctor |
| Appointment Update | Patient modifies pending/confirmed appointment |
| Appointment Cancellation | Patient cancels their own appointment |
| Appointment Deletion | Patient deletes a cancelled appointment record |
| Appointment Status | Doctor confirms, rejects, or completes appointments |
| Chat Contacts | Retrieve allowed chat contacts based on role |
| Chat Messaging | Send and retrieve messages between patient and doctor |
| Doctor Profile | Doctor creates/updates professional profile |
| Doctor Search | Patient searches for verified doctors |
| Admin Verification | Admin verifies doctor accounts |
| Role-Based Access | Endpoints enforce PATIENT/DOCTOR/ADMIN role restrictions |

---

## 3. Test Cases

### 3.1 Authentication

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Type |
|---|---|---|---|---|---|
| AUTH-001 | Register new PATIENT account | No existing account with email | POST /api/v1/auth/register with valid PATIENT payload | 201 Created, JWT token returned, user role = PATIENT | Integration |
| AUTH-002 | Register new DOCTOR account | No existing account with email | POST /api/v1/auth/register with valid DOCTOR payload | 201 Created, JWT token returned, user role = DOCTOR | Integration |
| AUTH-003 | Register with duplicate email | Account already exists | POST /api/v1/auth/register with existing email | 409 Conflict, EMAIL_ALREADY_EXISTS error code | Integration |
| AUTH-004 | Register with invalid email format | None | POST /api/v1/auth/register with malformed email | 400 Bad Request, VALIDATION_ERROR | Integration |
| AUTH-005 | Register with weak password | None | POST /api/v1/auth/register with password lacking special char | 400 Bad Request, VALIDATION_ERROR | Integration |
| AUTH-006 | Login with valid credentials | Account exists | POST /api/v1/auth/login with correct email/password | 200 OK, JWT token returned | Integration |
| AUTH-007 | Login with wrong password | Account exists | POST /api/v1/auth/login with incorrect password | 401 Unauthorized, INVALID_CREDENTIALS | Integration |
| AUTH-008 | Login with non-existent email | None | POST /api/v1/auth/login with unknown email | 401 Unauthorized, INVALID_CREDENTIALS | Integration |
| AUTH-009 | Logout revokes JWT | User is logged in | POST /api/v1/auth/logout with valid Bearer token | 204 No Content, token added to blacklist | Integration |
| AUTH-010 | Use revoked token after logout | Token has been revoked | GET /api/v1/auth/me with revoked token | 401 Unauthorized | Integration |
| AUTH-011 | Get current user profile | User is authenticated | GET /api/v1/auth/me with valid JWT | 200 OK, user data returned | Integration |
| AUTH-012 | Complete Google OAuth2 registration | Pending token exists | POST /api/v1/auth/oauth2/complete with valid pending token and role | 200 OK, full JWT returned | Integration |
| AUTH-013 | Complete OAuth2 with expired pending token | Pending token expired | POST /api/v1/auth/oauth2/complete with expired token | 400 Bad Request | Integration |
| AUTH-014 | AuthService.register() creates user | UserRepository mock | Call register() with valid RegisterRequest | User saved, token generated, AuthResponse returned | Unit |
| AUTH-015 | AuthService.login() validates password | UserRepository mock | Call login() with correct credentials | AuthResponse with token returned | Unit |
| AUTH-016 | AuthService.login() rejects wrong password | UserRepository mock | Call login() with wrong password | InvalidCredentialsException thrown | Unit |
| AUTH-017 | AuthService.register() rejects duplicate email | UserRepository mock returns existing | Call register() with duplicate email | EmailAlreadyExistsException thrown | Unit |

### 3.2 Appointments

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Type |
|---|---|---|---|---|---|
| APPT-001 | Patient creates appointment | Patient logged in, verified doctor exists | POST /api/v1/appointments with valid payload | 201 Created, AppointmentDto returned, status = PENDING_DOCTOR_APPROVAL | Integration |
| APPT-002 | Doctor cannot create appointment | Doctor logged in | POST /api/v1/appointments | 403 Forbidden | Integration |
| APPT-003 | Patient updates pending appointment | Patient owns appointment, status = PENDING | PUT /api/v1/appointments/{id} with new time | 200 OK, updated AppointmentDto | Integration |
| APPT-004 | Patient cancels appointment | Patient owns appointment | PUT /api/v1/appointments/{id}/cancel | 200 OK, status = CANCELLED | Integration |
| APPT-005 | Patient deletes cancelled appointment | Appointment status = CANCELLED | DELETE /api/v1/appointments/{id} | 200 OK, appointment removed | Integration |
| APPT-006 | Patient cannot delete non-cancelled appointment | Appointment status = CONFIRMED | DELETE /api/v1/appointments/{id} | 400 Bad Request | Integration |
| APPT-007 | Doctor confirms appointment | Doctor owns appointment, status = PENDING | PUT /api/v1/appointments/{id}/status with CONFIRMED | 200 OK, status = CONFIRMED | Integration |
| APPT-008 | Doctor rejects appointment | Doctor owns appointment | PUT /api/v1/appointments/{id}/status with REJECTED | 200 OK, status = REJECTED | Integration |
| APPT-009 | Doctor marks appointment completed | Appointment status = CONFIRMED | PUT /api/v1/appointments/{id}/status with COMPLETED | 200 OK, status = COMPLETED | Integration |
| APPT-010 | Doctor cannot mark pending as completed | Appointment status = PENDING | PUT /api/v1/appointments/{id}/status with COMPLETED | 400 Bad Request | Integration |
| APPT-011 | Slot conflict detection | Slot already booked | POST /api/v1/appointments with same doctor/time | 400 Bad Request, slot taken message | Integration |
| APPT-012 | List patient appointments | Patient logged in | GET /api/v1/appointments | 200 OK, list of patient's appointments | Integration |
| APPT-013 | List doctor appointments | Doctor logged in | GET /api/v1/appointments | 200 OK, list of doctor's appointments | Integration |
| APPT-014 | AppointmentService.createAppointment() | Mocked repos | Call createAppointment() with valid data | Appointment saved, DTO returned | Unit |
| APPT-015 | AppointmentService.cancelAppointment() | Mocked repos | Call cancelAppointment() on owned appointment | Status set to CANCELLED | Unit |
| APPT-016 | AppointmentService.updateStatus() rejects invalid transition | Mocked repos | Call updateStatus() with COMPLETED on PENDING | BadRequestException thrown | Unit |

### 3.3 Chat

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Type |
|---|---|---|---|---|---|
| CHAT-001 | Patient gets doctor contacts | Patient logged in, doctors exist | GET /api/v1/chat/contacts | 200 OK, list of doctors | Integration |
| CHAT-002 | Doctor gets patient contacts | Doctor logged in, patients exist | GET /api/v1/chat/contacts | 200 OK, list of patients and doctors | Integration |
| CHAT-003 | Patient sends message to doctor | Patient and doctor exist | POST /api/v1/chat/messages with valid payload | 201 Created, ChatMessageDto returned | Integration |
| CHAT-004 | Patient cannot message another patient | Two patients exist | POST /api/v1/chat/messages to another patient | 403 Forbidden | Integration |
| CHAT-005 | Get conversation history | Messages exist between users | GET /api/v1/chat/conversations/{otherUserId} | 200 OK, ordered list of messages | Integration |
| CHAT-006 | ChatService.getContacts() filters by role | Mocked UserRepository | Call getContacts() as PATIENT | Only DOCTOR contacts returned | Unit |
| CHAT-007 | ChatService.sendMessage() validates participants | Mocked repos | Call sendMessage() with mismatched appointment | BadRequestException thrown | Unit |

### 3.4 Doctor Profile

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Type |
|---|---|---|---|---|---|
| DOC-001 | Doctor creates profile | Doctor logged in, no profile exists | PUT /api/v1/doctors/me/profile with valid payload | 200 OK, DoctorProfileDto returned | Integration |
| DOC-002 | Doctor updates existing profile | Doctor has existing profile | PUT /api/v1/doctors/me/profile with updated data | 200 OK, updated DoctorProfileDto | Integration |
| DOC-003 | Patient cannot create doctor profile | Patient logged in | PUT /api/v1/doctors/me/profile | 403 Forbidden | Integration |
| DOC-004 | Search verified doctors | Verified doctors exist | GET /api/v1/doctors/search?q=cardio | 200 OK, matching doctors list | Integration |
| DOC-005 | Search returns empty for no match | No matching doctors | GET /api/v1/doctors/search?q=xyz123 | 200 OK, empty list | Integration |
| DOC-006 | Get own doctor profile | Doctor has profile | GET /api/v1/doctors/me/profile | 200 OK, DoctorProfileDto | Integration |
| DOC-007 | Get profile when none exists | Doctor has no profile | GET /api/v1/doctors/me/profile | 404 Not Found | Integration |

### 3.5 Admin

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Type |
|---|---|---|---|---|---|
| ADMIN-001 | Admin can view unverified doctors | Admin logged in, unverified doctors exist | GET /api/v1/admin/doctors (or equivalent) | 200 OK, list of unverified doctors | E2E |
| ADMIN-002 | Admin verifies a doctor | Admin logged in, doctor profile exists | Admin verification action | Doctor profile verified = true | E2E |
| ADMIN-003 | Non-admin cannot access admin endpoints | Patient logged in | Access admin endpoint | 403 Forbidden | Integration |

### 3.6 Role-Based Access Control

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Type |
|---|---|---|---|---|---|
| RBAC-001 | Unauthenticated request to protected endpoint | No JWT | GET /api/v1/appointments | 401 Unauthorized | Integration |
| RBAC-002 | Patient cannot access doctor-only endpoint | Patient JWT | PUT /api/v1/appointments/{id}/status | 403 Forbidden | Integration |
| RBAC-003 | Doctor cannot access patient-only cancel | Doctor JWT | PUT /api/v1/appointments/{id}/cancel | 403 Forbidden | Integration |
| RBAC-004 | Expired JWT rejected | Expired token | Any authenticated endpoint | 401 Unauthorized | Integration |

---

## 4. Automated Test Strategy

### 4.1 Backend Unit Tests (JUnit 5 + Mockito)
- **Location:** `backend/src/test/java/edu/cit/ramirez/medigo/features/`
- **Framework:** JUnit 5, Mockito, AssertJ
- **Coverage targets:** AuthService, AppointmentService, ChatService
- **Approach:** Mock all repository and external dependencies; test business logic in isolation

### 4.2 Backend Integration Tests (Spring Boot Test)
- **Location:** `backend/src/test/java/edu/cit/ramirez/medigo/features/`
- **Framework:** `@SpringBootTest`, `@WebMvcTest`, MockMvc, H2 in-memory database
- **Coverage targets:** AuthController, AppointmentController
- **Approach:** Full Spring context with test database; test HTTP request/response cycle

### 4.3 Web Frontend Tests
- **Framework:** Vitest + React Testing Library (recommended)
- **Coverage targets:** Auth pages (Login, Register, AuthCallback), API adapter functions
- **Approach:** Component rendering tests, mock API calls

### 4.4 Mobile Tests
- **Framework:** JUnit 4 + Espresso (Android)
- **Coverage targets:** SessionManager, ApiErrorParser
- **Approach:** Unit tests for utility classes; Espresso for UI flows

### 4.5 Test Execution
- Backend tests: `./mvnw test` from `backend/` directory
- Web tests: `npm run test` from `web/` directory
- Mobile tests: `./gradlew test` from `mobile/` directory

---

## 5. Test Environment

| Component | Environment |
|-----------|-------------|
| Backend | Spring Boot 3.x, Java 21, H2 (test), PostgreSQL (prod) |
| Web | Node.js 20+, Vite, React 18 |
| Mobile | Android API 26+, Kotlin 1.9+ |
| CI/CD | GitHub Actions (recommended) |

---

## 6. Entry and Exit Criteria

### Entry Criteria
- All feature code has been committed to the `refactor/vertical-slice-architecture` branch
- Build passes without compilation errors
- Test environment is configured

### Exit Criteria
- All unit tests pass (0 failures)
- All integration tests pass (0 failures)
- Code coverage ≥ 70% for service layer
- No critical bugs open

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Google OAuth2 not testable in CI | Mock OAuth2 flow in integration tests |
| Database state pollution between tests | Use `@Transactional` rollback or H2 reset |
| JWT expiry timing issues | Use fixed clock in tests |
| Mobile tests require emulator | Use Robolectric for unit-level Android tests |
