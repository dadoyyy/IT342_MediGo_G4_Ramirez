IT342 MOBILE APPLICATION - VERIFICATION REPORT
Date: April 12, 2026
Project: MediGo

================================================================================
7. MOBILE APPLICATION REQUIREMENT (REQUIRED) - VERIFICATION STATUS
================================================================================

7.1. Technology Requirement (STRICT)
────────────────────────────────────────────────────────────────────────────

Requirement                                 Status      Details
─────────────────────────────────────────   ──────────  ───────────────────
✅ Use Android Kotlin                       COMPLETE    All activities written in Kotlin
✅ Use XML-Based UI Layouts                 COMPLETE    activity_register.xml, activity_login.xml, 
                                                        activity_dashboard.xml in place
✅ Use Android API Level 34                 COMPLETE    compileSdk = 34, targetSdk = 34 in 
(Android 14)                                            build.gradle.kts
✅ Use Retrofit for API Integration         COMPLETE    Retrofit 2.11.0 configured in dependencies
                                                        AuthApi interface defined
✅ Connect to SAME backend                  COMPLETE    Uses same Spring Boot backend at 
                                                        /api/v1/auth/...
✅ NO Jetpack Compose                       COMPLETE    ✓ Not used
✅ NO Mock Data                             COMPLETE    ✓ All auth flows connect to real backend


7.2. Authentication Integration
────────────────────────────────────────────────────────────────────────────

✅ Login using backend JWT                  COMPLETE
   - LoginActivity makes POST /api/v1/auth/login
   - Backend returns JWT token in ApiResponse<AuthResponse>

✅ Store JWT Securely                       COMPLETE (With Note)
   - SessionManager uses SharedPreferences with MODE_PRIVATE
   - Token stored in key "token" 
   - Note: While MODE_PRIVATE is Android's standard, production apps may consider
     EncryptedSharedPreferences for additional security

⚠️  Send JWT in Authorization Header        ISSUE FOUND
   
   PROBLEM: ApiClient.kt DOES NOT include Authorization interceptor
   
   Current Code (INCOMPLETE):
   ┌─────────────────────────────────────────────────────────────┐
   │ private val client = OkHttpClient.Builder()                 │
   │     .addInterceptor(logging)                                │
   │     .build()                                                │
   │                                                             │
   │ ⚠️  Missing: Authorization header interceptor               │
   └─────────────────────────────────────────────────────────────┘

   REQUIRED FIX:
   The ApiClient must automatically add "Authorization: Bearer {token}"
   to all requests after login. Currently, protected endpoints cannot
   be accessed because the JWT is never sent to the server.

   RECOMMENDED IMPLEMENTATION:
   ┌─────────────────────────────────────────────────────────────┐
   │ // Add to ApiClient.kt in OkHttpClient.Builder section:     │
   │                                                             │
   │ .addInterceptor { chain ->                                 │
   │     val token = sessionManager?.token()                    │
   │     val originalRequest = chain.request()                 │
   │                                                             │
   │     val newRequest = if (token != null) {                 │
   │         originalRequest.newBuilder()                      │
   │             .header("Authorization", "Bearer $token")     │
   │             .build()                                      │
   │     } else {                                               │
   │         originalRequest                                   │
   │     }                                                       │
   │     chain.proceed(newRequest)                             │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘

❌ Access Protected Endpoints                INCOMPLETE
   - Backend requires: Authorization header in requests
   - Mobile cannot currently access protected endpoints
   - No interceptor to attach JWT token


7.3. Core Module Consumption
────────────────────────────────────────────────────────────────────────────

❌ Display Data from Core Business Module    NOT IMPLEMENTED
   STATUS: Backend has NO core business module controller
   
   FINDING: Only AuthController.java exists in backend
   Missing: AppointmentController, AppointmentService, Appointment entity
   
   WHAT'S NEEDED:
   - Backend must implement core business module (e.g., Appointments)
   - Mobile must have screens to display appointment data
   
   EXAMPLE FOR MEDIGO:
   Backend endpoints needed:
   - GET  /api/v1/appointments (list all appointments for user)
   - POST /api/v1/appointments (create new appointment)
   - GET  /api/v1/appointments/{id} (get single appointment)
   - PUT  /api/v1/appointments/{id} (update appointment)
   - DELETE /api/v1/appointments/{id} (cancel appointment)
   - GET  /api/v1/doctors (search available doctors) [ROLE-BASED]
   
   Mobile screens needed:
   - AppointmentListActivity (show user's appointments)
   - AppointmentDetailActivity (view single appointment)
   - BookAppointmentActivity (create/schedule appointment)
   - DoctorSearchActivity (browse available doctors)

❌ Access at Least 5 Protected Endpoints    NOT IMPLEMENTED
   CURRENT ENDPOINTS (4 total):
   1. ✅ POST /api/v1/auth/register (public)
   2. ✅ POST /api/v1/auth/login (public)
   3. ✅ POST /api/v1/auth/logout (PROTECTED - requires JWT)
   4. ✅ GET /api/v1/auth/me (PROTECTED - requires JWT)
   
   MISSING: Core business module endpoints
   
   REQUIRED: Minimum 5 protected endpoints that mobile actively consumes
   CURRENT: Only 1 protected non-auth endpoint (/me)

❌ Handle Error Responses Properly          PARTIAL
   - ApiErrorParser exists for parsing backend errors
   - Toast messages shown on failure
   - Missing: Detailed error handling UI for business logic failures
   

7.4. Role Awareness
────────────────────────────────────────────────────────────────────────────

⚠️  UI Adjusts Based on User Role            PARTIAL
   - RegisterActivity shows role selection (PATIENT/DOCTOR)
   - License field conditionally shown for DOCTOR role
   - Missing: Role-specific screens in main app
   
   WHAT'S NEEDED:
   - Different UI flows based on user.role
   - Example: After login, DOCTOR sees "Manage Appointments with Patients"
   - Example: After login, PATIENT sees "Book Appointment with Doctor"

⚠️  Unauthorized Actions Blocked            NOT TESTABLE
   - No core business screens exist to test authorization
   - Backend has authorization annotations (@PreAuthorize)
   - Mobile cannot verify because no protected endpoints are accessed


7.5. Proper API Integration
────────────────────────────────────────────────────────────────────────────

✅ Use Retrofit                              COMPLETE
✅ No Hardcoded/Mock Data                    COMPLETE
✅ Connect to Actual Backend                 COMPLETE


================================================================================
OVERALL MOBILE STATUS: PARTIAL COMPLETION
================================================================================

PASSING REQUIREMENTS:
✅ 7.1 - Technology Stack (Kotlin, XML, API 34, Retrofit)
✅ 7.2a - Login/JWT Storage (but missing: Authorization header)
✅ 7.5 - Retrofit integration

FAILING REQUIREMENTS:
❌ 7.2b - JWT in Authorization Header - CRITICAL FIX NEEDED
❌ 7.3 - Core Module Consumption (zero endpoints)
❌ 7.3 - At Least 5 Protected Endpoints (only 1 exists)
❌ 7.3 - Error Handling for Business Logic
❌ 7.4 - Role-Based UI Differentiation
❌ 7.4 - Test/Verify Unauthorized Access Blocking


================================================================================
CRITICAL ISSUES (Must be Fixed for Final Defense)
================================================================================

ISSUE #1: No Authorization Header Interceptor
──────────────────────────────────────────────
Severity: CRITICAL
Impact: All protected endpoints return 401 Unauthorized
Fix Effort: 30 minutes

Current behavior:
  Mobile app has JWT token but doesn't send it with requests.
  Backend receives requests without Authorization header.
  Server cannot authenticate requests → 401 errors.

Action: Add OkHttp interceptor to ApiClient.kt that:
  1. Retrieves token from SessionManager
  2. Adds header: "Authorization: Bearer {token}"
  3. Sends request with authentication


ISSUE #2: No Core Business Module in Backend
─────────────────────────────────────────────
Severity: CRITICAL
Impact: No protected endpoints to access; violates requirement 3
Fix Effort: 4-6 hours

Required deliverables:
  1. Create Appointment entity (JPA @Entity)
  2. Create AppointmentRepository (Spring Data)
  3. Create AppointmentService (business logic)
  4. Create AppointmentController (@RestController with CRUD)
  5. Add @PreAuthorize annotations for role-based access
  6. Setup Appointment ↔ User relationship (Many-to-One)
  7. Add proper validation and error handling


ISSUE #3: Only 3 Mobile Screens (Authentication Only)
──────────────────────────────────────────────────────
Severity: MAJOR
Impact: Cannot demonstrate core module consumption
Fix Effort: 4-6 hours

Required screens:
  1. ✅ LoginActivity (exists)
  2. ✅ RegisterActivity (exists)
  3. ✅ DashboardActivity (exists - needs role awareness)
  4. ❌ AppointmentListActivity (NEW - list user's appointments)
  5. ❌ BookAppointmentActivity (NEW - create appointment)
  6. ❌ DoctorListActivity (NEW - search doctors) [DOCTOR role only]
  7. ❌ AppointmentDetailActivity (NEW - view appointment)


ISSUE #4: No Role-Based UI Differentiation
───────────────────────────────────────────
Severity: MAJOR
Impact: Cannot demonstrate role-based access control
Fix Effort: 2-3 hours

Required changes:
  1. DashboardActivity should branch based on user.role
  2. PATIENT → Show "Book Appointment" button
  3. DOCTOR → Show "Manage Appointments" button
  4. Different menu options or navigation flow per role
  5. Verify UI prevents unauthorized actions


================================================================================
RECOMMENDATION FOR FINAL DEFENSE
================================================================================

TIMELINE TO COMPLETION:

Phase 1 (1-2 hours): Core Infrastructure Fixes
  ✓ Step 1: Add Authorization header interceptor to ApiClient.kt
  ✓ Step 2: Test that /api/v1/auth/me returns 200 (not 401)
  ✓ Step 3: Verify JWT is being sent in all subsequent requests

Phase 2 (6-8 hours): Backend Core Module Implementation
  ✓ Step 1: Create Appointment entity with proper relationships
  ✓ Step 2: Create AppointmentRepository
  ✓ Step 3: Create AppointmentService with CRUD logic
  ✓ Step 4: Create AppointmentController with 5+ endpoints
  ✓ Step 5: Add role-based security (@PreAuthorize)
  ✓ Step 6: Test all endpoints with Postman/Insomnia
  
  Minimum Endpoints:
    POST   /api/v1/appointments              (create)
    GET    /api/v1/appointments              (list for user)
    GET    /api/v1/appointments/{id}         (read)
    PUT    /api/v1/appointments/{id}         (update)
    DELETE /api/v1/appointments/{id}         (delete)
    GET    /api/v1/doctors                   (search - role based)

Phase 3 (4-6 hours): Mobile UI Screens + Integration
  ✓ Step 1: Create AppointmentAdapter (RecyclerView for list)
  ✓ Step 2: Add AppointmentApi interface to AuthApi.kt
  ✓ Step 3: Create AppointmentListActivity
  ✓ Step 4: Create BookAppointmentActivity
  ✓ Step 5: Create DoctorListActivity
  ✓ Step 6: Update DashboardActivity with role-based navigation
  ✓ Step 7: Add error handling for failed API calls

Phase 4 (1-2 hours): Testing + Final Verification
  ✓ Step 1: Test on Android Emulator
  ✓ Step 2: Test on physical device (if available)
  ✓ Step 3: Verify all 5+ protected endpoints work
  ✓ Step 4: Test role-based access (PATIENT vs DOCTOR)
  ✓ Step 5: Test error scenarios (401, 403, 404, validation)


ESTIMATED TOTAL TIME: 12-18 hours of development


================================================================================
REFERENCE FOR COMPARISON
================================================================================

Current IT342 Requirements Status:

1. Authentication & Security         ⚠️  PARTIAL (JWT sent, but not in headers)
2. Role-Based Access Control         ❌ NOT TESTED (no core module)
3. Core Business Module              ❌ NOT IMPLEMENTED (no controller)
4.1 External API Integration         ❓ NOT VERIFIED (not checked)
4.2 Google OAuth                     ⚠️  CODED BUT NOT TESTED (in backend)
4.3 File Upload                      ❓ NOT VERIFIED
4.4 Payment Gateway                  ❓ NOT VERIFIED
4.5 Real-Time Feature                ❓ NOT VERIFIED (optional)
4.6 Email Sending                    ❓ NOT VERIFIED
4.7 Backend Spring Boot              ✅ COMPLETE
4.8 Web Application (React)          ❓ NOT VERIFIED (out of scope)
5. Database Requirements              ✅ PARTIAL (auth tables exist)
6. Architecture Requirements          ✅ LAYERED PATTERN + DTOs
7. Mobile Application                 ⚠️  PARTIAL (infrastructure exists, NO DATA SCREENS)
8. Application Name                  ✅ COMPLETE (MediGo)
9. Repository Structure              ✅ COMPLETE (IT342_MediGo_G4_Ramirez)


================================================================================
NEXT STEPS
================================================================================

1. IMMEDIATE (Do first): Add Authorization header interceptor
   File: ApiClient.kt
   Why: Blocks all other mobile progress

2. PRIORITY (Do second): Implement backend Appointment module
   Files: Appointment.java, AppointmentRepository.java, AppointmentService.java,
           AppointmentController.java
   Why: Provides the protected endpoints mobile needs to access

3. IMPORTANT (Do parallel): Create mobile screens for appointments
   Files: AppointmentListActivity.kt, BookAppointmentActivity.kt,
           AppointmentApi interface extension
   Why: Demonstrates core module consumption and protected endpoint access

4. VERIFICATION: Test end-to-end auth + appointment workflow
   Why: Required for passing final defense
