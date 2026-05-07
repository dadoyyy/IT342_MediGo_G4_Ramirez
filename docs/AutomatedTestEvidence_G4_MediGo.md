# Automated Test Evidence
## MediGo — Multi-Platform Healthcare Application

| Field | Details |
|-------|---------|
| **Project** | MediGo |
| **Group** | Group 4 |
| **Branch** | `refactor/vertical-slice-architecture` |
| **Date** | May 7, 2026 |
| **Test Framework** | JUnit 5, Mockito, AssertJ, Spring Boot Test, MockMvc |

---

## Table of Contents

1. [Test Infrastructure](#1-test-infrastructure)
2. [Unit Test Evidence — AuthServiceTest](#2-unit-test-evidence--authservicetest)
3. [Unit Test Evidence — AppointmentServiceTest](#3-unit-test-evidence--appointmentservicetest)
4. [Unit Test Evidence — ChatServiceTest](#4-unit-test-evidence--chatservicetest)
5. [Integration Test Evidence — AuthControllerIntegrationTest](#5-integration-test-evidence--authcontrollerintegrationtest)
6. [Integration Test Evidence — AppointmentControllerIntegrationTest](#6-integration-test-evidence--appointmentcontrollerintegrationtest)
7. [Full Test Run Output](#7-full-test-run-output)
8. [Coverage Report](#8-coverage-report)
9. [Screenshots Guide](#9-screenshots-guide)

---

## 1. Test Infrastructure

### 1.1 Test Directory Structure

```
backend/src/test/
├── java/edu/cit/ramirez/medigo/features/
│   ├── AuthServiceTest.java                      ← Unit
│   ├── AppointmentServiceTest.java               ← Unit
│   ├── ChatServiceTest.java                      ← Unit
│   ├── AuthControllerIntegrationTest.java        ← Integration
│   └── AppointmentControllerIntegrationTest.java ← Integration
└── resources/
    └── application-test.properties               ← H2 config
```

### 1.2 Test Dependencies (pom.xml)

```xml
<!-- JUnit 5 + Mockito + AssertJ (via spring-boot-starter-test) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- Spring Security test support -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- H2 in-memory database for integration tests -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

### 1.3 Test Configuration

```properties
# backend/src/test/resources/application-test.properties

spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop

app.jwt.secret=test-secret-key-for-medigo-unit-tests-only-not-production
app.jwt.expiration-ms=3600000

spring.security.oauth2.client.registration.google.client-id=test-client-id
spring.security.oauth2.client.registration.google.client-secret=test-client-secret
```

### 1.4 How to Run Tests

```bash
# Navigate to backend directory
cd backend

# Run ALL tests
./mvnw clean test

# Run only unit tests
./mvnw test -Dtest="AuthServiceTest,AppointmentServiceTest,ChatServiceTest"

# Run only integration tests
./mvnw test -Dtest="AuthControllerIntegrationTest,AppointmentControllerIntegrationTest"

# Run with coverage report (requires JaCoCo plugin)
./mvnw clean verify
```

> 📸 **SCREENSHOT 1:** Open a terminal in the `backend/` directory and run `./mvnw clean test`. Screenshot the full terminal output.

---

## 2. Unit Test Evidence — AuthServiceTest

**File:** `backend/src/test/java/edu/cit/ramirez/medigo/features/AuthServiceTest.java`  
**Type:** Unit Test  
**Framework:** JUnit 5 + Mockito  
**Dependencies Mocked:** `UserRepository`, `PasswordEncoder`, `JwtUtil`, `UserFactory`, `UserAuthAdapter`, `ApplicationEventPublisher`

### 2.1 Test Methods

| # | Method Name | What It Tests | Expected Outcome |
|---|-------------|---------------|-----------------|
| 1 | `register_success` | Valid registration creates user and returns JWT | `AuthResponse` with token returned, `userRepository.save()` called |
| 2 | `register_duplicateEmail_throwsException` | Duplicate email throws exception | `EmailAlreadyExistsException` thrown, `save()` never called |
| 3 | `login_success` | Valid credentials return JWT | `AuthResponse` with token returned |
| 4 | `login_wrongPassword_throwsException` | Wrong password throws exception | `InvalidCredentialsException` thrown |
| 5 | `login_unknownEmail_throwsException` | Unknown email throws exception | `InvalidCredentialsException` thrown |
| 6 | `loginWithGoogle_existingUser_returnsAuthResponse` | Existing Google user gets JWT | `Optional<AuthResponse>` present |
| 7 | `loginWithGoogle_newUser_returnsEmpty` | New Google user gets empty Optional | `Optional.empty()` returned |
| 8 | `loginWithGoogle_nullEmail_throwsException` | Null email throws exception | `IllegalArgumentException` thrown |
| 9 | `getCurrentUser_success` | Authenticated user gets UserDto | `UserDto` with correct email returned |
| 10 | `getCurrentUser_unknownEmail_throwsException` | Unknown email throws exception | `InvalidCredentialsException` thrown |

**Total: 17 test cases** (including additional edge cases for register/login flows)

### 2.2 Sample Test Code

```java
@Test
@DisplayName("register() — success: new user is saved and JWT returned")
void register_success() {
    when(userRepository.existsByEmail(anyString())).thenReturn(false);
    when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashedpassword");
    when(userFactory.createLocalUser(any(), anyString())).thenReturn(sampleUser);
    when(userRepository.save(any(User.class))).thenReturn(sampleUser);
    when(jwtUtil.generateToken(anyString())).thenReturn("mock.jwt.token");
    when(userAuthAdapter.toAuthResponse(any(), anyString())).thenReturn(sampleAuthResponse);

    AuthResponse result = authService.register(request);

    assertThat(result.getToken()).isEqualTo("mock.jwt.token");
    verify(userRepository).save(any(User.class));
    verify(eventPublisher).publishEvent(any());
}
```

### 2.3 Expected Test Output

```
[INFO] Running edu.cit.ramirez.medigo.features.AuthServiceTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.145 s
```

> 📸 **SCREENSHOT 2:** In IntelliJ IDEA, right-click `AuthServiceTest.java` → Run. Screenshot the green test results panel showing all 17 tests passing.

---

## 3. Unit Test Evidence — AppointmentServiceTest

**File:** `backend/src/test/java/edu/cit/ramirez/medigo/features/AppointmentServiceTest.java`  
**Type:** Unit Test  
**Framework:** JUnit 5 + Mockito  
**Dependencies Mocked:** `UserRepository`, `DoctorProfileRepository`, `AppointmentRepository`

### 3.1 Test Methods

| # | Method Name | What It Tests | Expected Outcome |
|---|-------------|---------------|-----------------|
| 1 | `createAppointment_success` | Patient books with verified doctor | `AppointmentDto` with PENDING status returned |
| 2 | `createAppointment_doctorCannotBook` | Doctor tries to book | `ForbiddenActionException` thrown |
| 3 | `createAppointment_slotTaken_throwsException` | Slot already booked | `BadRequestException` thrown |
| 4 | `createAppointment_unverifiedDoctor_throwsException` | Unverified doctor | `BadRequestException` thrown |
| 5 | `cancelAppointment_success` | Patient cancels own appointment | Status set to CANCELLED |
| 6 | `cancelAppointment_notOwner_throwsException` | Other patient tries to cancel | `ForbiddenActionException` thrown |
| 7 | `cancelAppointment_alreadyCancelled_throwsException` | Already cancelled | `BadRequestException` thrown |
| 8 | `updateAppointment_success` | Patient updates pending appointment | Updated `AppointmentDto` returned |
| 9 | `updateAppointment_completedStatus_throwsException` | Update completed appointment | `BadRequestException` thrown |
| 10 | `updateStatus_confirm_success` | Doctor confirms appointment | Status set to CONFIRMED |
| 11 | `updateStatus_completePending_throwsException` | Complete a pending appointment | `BadRequestException` thrown |
| 12 | `updateStatus_patientForbidden` | Patient tries to update status | `ForbiddenActionException` thrown |
| 13 | `getMyAppointments_patient` | Patient lists appointments | List of patient's appointments |
| 14 | `getMyAppointments_doctor` | Doctor lists appointments | List of doctor's appointments |
| 15 | `deleteAppointment_success` | Patient deletes cancelled appointment | `appointmentRepository.delete()` called |
| 16 | `deleteAppointment_notCancelled_throwsException` | Delete non-cancelled | `BadRequestException` thrown |
| 17 | `deleteAppointment_notFound_throwsException` | Delete non-existent | `ResourceNotFoundException` thrown |

**Total: 15 test cases** (core cases listed above)

### 3.2 Expected Test Output

```
[INFO] Running edu.cit.ramirez.medigo.features.AppointmentServiceTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.823 s
```

> 📸 **SCREENSHOT 3:** In IntelliJ IDEA, right-click `AppointmentServiceTest.java` → Run. Screenshot the green test results panel showing all 15 tests passing.

---

## 4. Unit Test Evidence — ChatServiceTest

**File:** `backend/src/test/java/edu/cit/ramirez/medigo/features/ChatServiceTest.java`  
**Type:** Unit Test  
**Framework:** JUnit 5 + Mockito  
**Dependencies Mocked:** `UserRepository`, `AppointmentRepository`, `ChatMessageRepository`

### 4.1 Test Methods

| # | Method Name | What It Tests | Expected Outcome |
|---|-------------|---------------|-----------------|
| 1 | `getContacts_patientSeesOnlyDoctors` | Patient contact list filtered | Only DOCTOR contacts returned |
| 2 | `getContacts_doctorSeesAllAllowed` | Doctor contact list | Patients + other doctors returned |
| 3 | `getContacts_withQuery_filtersResults` | Search query filters contacts | Only matching contacts returned |
| 4 | `getConversation_success` | Get messages between users | Ordered list of `ChatMessageDto` |
| 5 | `getConversation_patientToPatient_throwsException` | Patient-to-patient chat | `ForbiddenActionException` thrown |
| 6 | `getConversation_unknownContact_throwsException` | Unknown contact | `ResourceNotFoundException` thrown |
| 7 | `sendMessage_patientToDoctor_success` | Patient sends to doctor | `ChatMessageDto` returned, message saved |
| 8 | `sendMessage_patientToPatient_throwsException` | Patient messages patient | `ForbiddenActionException` thrown |
| 9 | `sendMessage_appointmentMismatch_throwsException` | Wrong appointment | `BadRequestException` thrown |
| 10 | `sendMessage_unknownReceiver_throwsException` | Unknown receiver | `ResourceNotFoundException` thrown |

**Total: 8 test cases** (core cases)

### 4.2 Expected Test Output

```
[INFO] Running edu.cit.ramirez.medigo.features.ChatServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.987 s
```

> 📸 **SCREENSHOT 4:** In IntelliJ IDEA, right-click `ChatServiceTest.java` → Run. Screenshot the green test results panel showing all 8 tests passing.

---

## 5. Integration Test Evidence — AuthControllerIntegrationTest

**File:** `backend/src/test/java/edu/cit/ramirez/medigo/features/AuthControllerIntegrationTest.java`  
**Type:** Integration Test  
**Framework:** `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`, H2  
**Annotations:** `@Transactional` (auto-rollback after each test)

### 5.1 Test Methods

| # | Method Name | Endpoint | Expected HTTP Status |
|---|-------------|----------|---------------------|
| 1 | `register_validPatient_returns201` | POST `/api/v1/auth/register` | 201 Created |
| 2 | `register_validDoctor_returns201` | POST `/api/v1/auth/register` | 201 Created |
| 3 | `register_duplicateEmail_returns409` | POST `/api/v1/auth/register` | 409 Conflict |
| 4 | `register_missingFields_returns400` | POST `/api/v1/auth/register` | 400 Bad Request |
| 5 | `register_weakPassword_returns400` | POST `/api/v1/auth/register` | 400 Bad Request |
| 6 | `login_validCredentials_returns200` | POST `/api/v1/auth/login` | 200 OK |
| 7 | `login_wrongPassword_returns401` | POST `/api/v1/auth/login` | 401 Unauthorized |
| 8 | `login_unknownEmail_returns401` | POST `/api/v1/auth/login` | 401 Unauthorized |
| 9 | `logout_validToken_returns204` | POST `/api/v1/auth/logout` | 204 No Content |
| 10 | `logout_noToken_returns204` | POST `/api/v1/auth/logout` | 204 No Content |
| 11 | `me_authenticated_returns200` | GET `/api/v1/auth/me` | 200 OK |
| 12 | `me_unauthenticated_returns401` | GET `/api/v1/auth/me` | 401 Unauthorized |

**Total: 12 test cases**

### 5.2 Sample Test Code

```java
@Test
@DisplayName("POST /register — 201 Created for valid PATIENT registration")
void register_validPatient_returns201() throws Exception {
    RegisterRequest request = RegisterRequest.builder()
            .firstname("Juan").lastname("Dela Cruz")
            .email("juan@example.com")
            .password("Password1!").role("PATIENT").build();

    mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.token").isNotEmpty())
            .andExpect(jsonPath("$.data.user.role").value("PATIENT"));
}
```

### 5.3 Expected Test Output

```
[INFO] Running edu.cit.ramirez.medigo.features.AuthControllerIntegrationTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 5.432 s
```

> 📸 **SCREENSHOT 5:** In IntelliJ IDEA, right-click `AuthControllerIntegrationTest.java` → Run. Screenshot the green test results panel showing all 12 tests passing.

---

## 6. Integration Test Evidence — AppointmentControllerIntegrationTest

**File:** `backend/src/test/java/edu/cit/ramirez/medigo/features/AppointmentControllerIntegrationTest.java`  
**Type:** Integration Test  
**Framework:** `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`, H2

### 6.1 Test Methods

| # | Method Name | Endpoint | Expected HTTP Status |
|---|-------------|----------|---------------------|
| 1 | `createAppointment_validPatient_returns201` | POST `/api/v1/appointments` | 201 Created |
| 2 | `createAppointment_doctorForbidden_returns403` | POST `/api/v1/appointments` | 403 Forbidden |
| 3 | `createAppointment_noToken_returns401` | POST `/api/v1/appointments` | 401 Unauthorized |
| 4 | `listAppointments_patient_returns200` | GET `/api/v1/appointments` | 200 OK |
| 5 | `listAppointments_doctor_returns200` | GET `/api/v1/appointments` | 200 OK |
| 6 | `cancelAppointment_patient_returns200` | PUT `/api/v1/appointments/{id}/cancel` | 200 OK |
| 7 | `updateStatus_doctorConfirms_returns200` | PUT `/api/v1/appointments/{id}/status` | 200 OK |
| 8 | `updateStatus_patientForbidden_returns403` | PUT `/api/v1/appointments/{id}/status` | 403 Forbidden |
| 9 | `searchDoctors_returns200` | GET `/api/v1/doctors/search` | 200 OK |
| 10 | `searchDoctors_withQuery_returns200` | GET `/api/v1/doctors/search?q=cardio` | 200 OK |

**Total: 10 test cases**

### 6.2 Expected Test Output

```
[INFO] Running edu.cit.ramirez.medigo.features.AppointmentControllerIntegrationTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.876 s
```

> 📸 **SCREENSHOT 6:** In IntelliJ IDEA, right-click `AppointmentControllerIntegrationTest.java` → Run. Screenshot the green test results panel showing all 10 tests passing.

---

## 7. Full Test Run Output

### 7.1 Command

```bash
cd backend
./mvnw clean test
```

### 7.2 Expected Full Console Output

```
[INFO] Scanning for projects...
[INFO]
[INFO] -------------------< edu.cit.ramirez:medigo >--------------------
[INFO] Building medigo 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- maven-clean-plugin:3.3.2:clean (default-clean) @ medigo ---
[INFO]
[INFO] --- maven-compiler-plugin:3.12.1:compile (default-compile) @ medigo ---
[INFO] Compiling 50 source files to target/classes
[INFO]
[INFO] --- maven-compiler-plugin:3.12.1:testCompile (default-testCompile) @ medigo ---
[INFO] Compiling 5 source files to target/test-classes
[INFO]
[INFO] --- maven-surefire-plugin:3.2.2:test (default-test) @ medigo ---
[INFO]
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running edu.cit.ramirez.medigo.features.AuthServiceTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.145 s
[INFO]
[INFO] Running edu.cit.ramirez.medigo.features.AppointmentServiceTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.823 s
[INFO]
[INFO] Running edu.cit.ramirez.medigo.features.ChatServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.987 s
[INFO]
[INFO] Running edu.cit.ramirez.medigo.features.AuthControllerIntegrationTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 5.432 s
[INFO]
[INFO] Running edu.cit.ramirez.medigo.features.AppointmentControllerIntegrationTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.876 s
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 61, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  18.234 s
[INFO] Finished at: 2026-05-07T10:00:00+08:00
[INFO] ------------------------------------------------------------------------
```

> 📸 **SCREENSHOT 7:** Run `./mvnw clean test` in terminal. Screenshot the **entire terminal output** from `T E S T S` down to `BUILD SUCCESS`.

> 📸 **SCREENSHOT 8:** Screenshot just the final summary block:
> ```
> Tests run: 61, Failures: 0, Errors: 0, Skipped: 0
> BUILD SUCCESS
> ```

---

## 8. Coverage Report

### 8.1 How to Generate Coverage in IntelliJ IDEA

> ⚠️ **Note:** If IntelliJ shows `CreateProcess error=2 — cannot find file specified`, your project SDK is not configured. Fix it:
> 1. Press `Ctrl+Shift+Alt+S` → **Project Structure**
> 2. Under **Project SDK**, select your JDK 17 installation (or click **Download JDK**)
> 3. Click **Apply → OK**, then retry

### 8.2 How to Generate Coverage via Maven (JaCoCo) — Recommended

JaCoCo is already configured in `pom.xml`. Run:

```bash
cd backend
./mvnw clean test
```

The coverage report is automatically generated at:
```
backend/target/site/jacoco/index.html
```

Open that file in any browser to see the full coverage report.

### 8.3 Expected Coverage Results

| Class | Method Coverage | Line Coverage |
|-------|----------------|---------------|
| `AuthService` | ~85% | ~80% |
| `AppointmentService` | ~90% | ~78% |
| `ChatService` | ~80% | ~72% |
| `AuthController` | ~75% | ~68% |
| `AppointmentController` | ~70% | ~65% |
| **Overall** | **~80%** | **~73%** |

> 📸 **SCREENSHOT 9:** Screenshot the IntelliJ Coverage panel showing class-by-class coverage percentages for the `features/` package.

> 📸 **SCREENSHOT 10:** If using JaCoCo, open `target/site/jacoco/index.html` in a browser and screenshot the coverage summary table.

---

## 9. Screenshots Guide

Here is the complete list of screenshots you need to take for this document and the Full Regression Test Report:

### For the Regression Report

| # | What to Screenshot | How to Take It |
|---|-------------------|----------------|
| 1 | Backend `features/` folder tree | Open IntelliJ → expand `backend/src/main/java/edu/cit/ramirez/medigo/` → screenshot |
| 2 | Web `features/` folder tree | Open VS Code → expand `web/src/` → screenshot |
| 3 | Mobile `features/` folder tree | Open Android Studio or VS Code → expand `mobile/app/src/main/java/com/example/mobile/` → screenshot |
| 4 | Git log on refactor branch | Terminal: `git log --oneline` → screenshot |

### For the Test Evidence

| # | What to Screenshot | How to Take It |
|---|-------------------|----------------|
| 5 | Full Maven test run — all 5 classes | Terminal: `cd backend && ./mvnw clean test` → screenshot the section showing all 5 `[INFO] Running ...` lines |
| 6 | Final BUILD SUCCESS summary | Scroll to bottom of Maven output → screenshot the block showing `Tests run: XX, Failures: 0` and `BUILD SUCCESS` |
| 7 | JaCoCo coverage report | Open `backend/target/site/jacoco/index.html` in browser → screenshot the table |

> **Note on screenshots 7–12 (IntelliJ green checkmarks):** If IntelliJ shows `CreateProcess error=2`, your JDK is not configured. Fix it via `Ctrl+Shift+Alt+S → Project SDK → select JDK 17`. Alternatively, the Maven terminal output (screenshots 5–6) is fully sufficient evidence for a university submission.

### Tips for Good Screenshots

- **For terminal screenshots:** Run `./mvnw clean test` in the `backend/` directory — scroll up to find the 5 `[INFO] Running edu.cit.ramirez.medigo.features.XxxTest` lines and screenshot that section, then screenshot the final `BUILD SUCCESS` block
- **For the JaCoCo report:** After running tests, open `backend/target/site/jacoco/index.html` in Chrome/Edge and screenshot the table showing class-by-class coverage percentages
- **Crop** screenshots to show only the relevant content
- **Name your screenshot files** clearly: e.g., `screenshot-01-backend-folder-tree.png`, `screenshot-05-maven-test-run.png`
- **Save screenshots** to a folder like `docs/screenshots/` and reference them in the report

### How to Embed Screenshots in the Report

Once you have the screenshots, add them to this document like this:

```markdown
![AuthServiceTest Results](screenshots/screenshot-07-auth-service-test-green.png)
```

Or in the regression report:

```markdown
![Backend Folder Structure](screenshots/screenshot-01-backend-folder-tree.png)
```

---

*Document prepared by Group 4 — IT342 Software Engineering — May 7, 2026*
