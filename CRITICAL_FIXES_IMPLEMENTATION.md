# CRITICAL FIXES REQUIRED - Implementation Guide

## ISSUE #1: Add Authorization Header Interceptor (CRITICAL - Fix First)

### Problem
Your JWT token is not being sent with API requests. Backend returns 401 Unauthorized.

### File to Update
`mobile/app/src/main/java/com/example/mobile/api/ApiClient.kt`

### Current Code
```kotlin
private val client = OkHttpClient.Builder()
    .addInterceptor(logging)
    .build()
```

### Fixed Code
Replace the entire ApiClient.kt with:

```kotlin
package com.example.mobile.api

import com.example.mobile.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.Interceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // ✨ NEW: Authorization Interceptor - adds JWT to all requests
    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        
        // Only add Authorization header if URL is not for registration/login
        // (those are public endpoints that don't need JWT)
        val isAuthEndpoint = originalRequest.url.encodedPath?.contains("/auth/register") == true ||
                           originalRequest.url.encodedPath?.contains("/auth/login") == true
        
        if (isAuthEndpoint) {
            // Public endpoints - pass through without JWT
            return@Interceptor chain.proceed(originalRequest)
        }
        
        // Get token from session (you'll need to pass SessionManager here)
        val token = ApiClientToken.getToken()
        
        val newRequest = if (token != null && token.isNotEmpty()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        chain.proceed(newRequest)
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .addInterceptor(authInterceptor)  // ✨ Add auth interceptor AFTER logging
        .build()

    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
}

// ✨ NEW: Helper object to access SessionManager from ApiClient singleton
object ApiClientToken {
    private var sessionManager: com.example.mobile.session.SessionManager? = null
    
    fun initialize(sessionManager: com.example.mobile.session.SessionManager) {
        this.sessionManager = sessionManager
    }
    
    fun getToken(): String? {
        return sessionManager?.token()
    }
    
    fun clearToken() {
        sessionManager?.clearSession()
    }
}
```

### Step 2: Update LoginActivity to Initialize ApiClient Token

In **LoginActivity.kt**, update the success handler:

```kotlin
// In LoginActivity.kt, in the onResponse method where you save session:
if (response.isSuccessful && body?.success == true && body.data != null) {
    val auth = body.data
    val sessionManager = com.example.mobile.session.SessionManager(this@LoginActivity)
    sessionManager.saveSession(
        token = auth.token,
        email = auth.user.email,
        fullName = auth.user.fullName,
        role = auth.user.role
    )
    
    // ✨ NEW: Initialize ApiClient with session manager
    com.example.mobile.api.ApiClientToken.initialize(sessionManager)
    
    Toast.makeText(
        this@LoginActivity,
        "Login successful",
        Toast.LENGTH_LONG
    ).show()
    startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
    finish()
}
```

### Step 3: Update RegisterActivity Similarly

Same initialization in **RegisterActivity.kt** success handler:

```kotlin
Toast.makeText(
    this@RegisterActivity,
    "Registration successful",
    Toast.LENGTH_LONG
).show()

// ✨ NEW: Initialize ApiClient with session manager
com.example.mobile.api.ApiClientToken.initialize(sessionManager)

startActivity(Intent(this@RegisterActivity, DashboardActivity::class.java))
finish()
```

### Verification Test

After making these changes, rebuild and test:

```bash
cd mobile
./gradlew :app:assembleDebug
```

Try logging in - check Logcat (Android Studio) for Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ISSUE #2: Backend - Create Appointment Module

### What Backend Needs

Create these files in `backend/src/main/java/edu/cit/ramirez/medigo/`:

#### 1. Appointment Entity
**File:** `entity/Appointment.java`

```java
package edu.cit.ramirez.medigo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;
    
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;
    
    @Column(nullable = false)
    private LocalDateTime appointmentTime;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status; // PENDING, CONFIRMED, CANCELLED
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**File:** `entity/AppointmentStatus.java`

```java
package edu.cit.ramirez.medigo.entity;

public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    CANCELLED
}
```

#### 2. AppointmentRepository
**File:** `repository/AppointmentRepository.java`

```java
package edu.cit.ramirez.medigo.repository;

import edu.cit.ramirez.medigo.entity.Appointment;
import edu.cit.ramirez.medigo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientOrderByAppointmentTimeDesc(User patient);
    List<Appointment> findByDoctorOrderByAppointmentTimeDesc(User doctor);
    List<Appointment> findByDoctorAndAppointmentTimeGreaterThanEqual(User doctor, LocalDateTime dateTime);
}
```

#### 3. AppointmentDTO
**File:** `dto/AppointmentDto.java`

```java
package edu.cit.ramirez.medigo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentDto {
    private Long id;
    private String patientName;
    private String patientEmail;
    private String doctorName;
    private String doctorEmail;
    private LocalDateTime appointmentTime;
    private String reason;
    private String status;
}
```

**File:** `dto/CreateAppointmentRequest.java`

```java
package edu.cit.ramirez.medigo.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateAppointmentRequest {
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    
    @NotNull(message = "Appointment time is required")
    @FutureOrPresent(message = "Appointment time must be in the future")
    private LocalDateTime appointmentTime;
    
    @NotBlank(message = "Reason is required")
    @Size(min = 10, max = 500, message = "Reason must be 10-500 characters")
    private String reason;
}
```

#### 4. AppointmentService
**File:** `service/AppointmentService.java`

```java
package edu.cit.ramirez.medigo.service;

import edu.cit.ramirez.medigo.dto.AppointmentDto;
import edu.cit.ramirez.medigo.dto.CreateAppointmentRequest;
import edu.cit.ramirez.medigo.entity.Appointment;
import edu.cit.ramirez.medigo.entity.AppointmentStatus;
import edu.cit.ramirez.medigo.entity.User;
import edu.cit.ramirez.medigo.entity.Role;
import edu.cit.ramirez.medigo.repository.AppointmentRepository;
import edu.cit.ramirez.medigo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public List<AppointmentDto> getMyAppointments(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Appointment> appointments = appointmentRepository.findByPatientOrderByAppointmentTimeDesc(user);
        return appointments.stream().map(this::toDto).collect(Collectors.toList());
    }

    public AppointmentDto createAppointment(String patientEmail, CreateAppointmentRequest request) {
        User patient = userRepository.findByEmail(patientEmail)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        User doctor = userRepository.findById(request.getDoctorId())
            .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (!doctor.getRole().equals(Role.DOCTOR)) {
            throw new RuntimeException("Can only book appointments with doctors");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.PENDING);

        Appointment saved = appointmentRepository.save(appointment);
        return toDto(saved);
    }

    public AppointmentDto getAppointment(Long id, String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        boolean isOwner = appointment.getPatient().getId().equals(user.getId()) ||
                         appointment.getDoctor().getId().equals(user.getId());
        
        if (!isOwner) {
            throw new RuntimeException("Unauthorized");
        }

        return toDto(appointment);
    }

    public AppointmentDto updateAppointment(Long id, CreateAppointmentRequest request, String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        if (!appointment.getPatient().getId().equals(user.getId())) {
            throw new RuntimeException("Only patient can update appointment");
        }

        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());
        
        Appointment updated = appointmentRepository.save(appointment);
        return toDto(updated);
    }

    public void deleteAppointment(Long id, String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        if (!appointment.getPatient().getId().equals(user.getId())) {
            throw new RuntimeException("Only patient can cancel appointment");
        }

        appointmentRepository.delete(appointment);
    }

    private AppointmentDto toDto(Appointment appointment) {
        return new AppointmentDto(
            appointment.getId(),
            appointment.getPatient().getFullName(),
            appointment.getPatient().getEmail(),
            appointment.getDoctor().getFullName(),
            appointment.getDoctor().getEmail(),
            appointment.getAppointmentTime(),
            appointment.getReason(),
            appointment.getStatus().toString()
        );
    }
}
```

#### 5. AppointmentController
**File:** `controller/AppointmentController.java`

```java
package edu.cit.ramirez.medigo.controller;

import edu.cit.ramirez.medigo.dto.AppointmentDto;
import edu.cit.ramirez.medigo.dto.CreateAppointmentRequest;
import edu.cit.ramirez.medigo.response.ApiResponse;
import edu.cit.ramirez.medigo.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
public class AppointmentController {
    private final AppointmentService appointmentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<AppointmentDto>> getMyAppointments(Principal principal) {
        List<AppointmentDto> appointments = appointmentService.getMyAppointments(principal.getName());
        return ApiResponse.ok(appointments);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<AppointmentDto> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request,
            Principal principal) {
        AppointmentDto appointment = appointmentService.createAppointment(principal.getName(), request);
        return ApiResponse.ok(appointment);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AppointmentDto> getAppointment(
            @PathVariable Long id,
            Principal principal) {
        AppointmentDto appointment = appointmentService.getAppointment(id, principal.getName());
        return ApiResponse.ok(appointment);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<AppointmentDto> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CreateAppointmentRequest request,
            Principal principal) {
        AppointmentDto appointment = appointmentService.updateAppointment(id, request, principal.getName());
        return ApiResponse.ok(appointment);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('PATIENT')")
    public void deleteAppointment(
            @PathVariable Long id,
            Principal principal) {
        appointmentService.deleteAppointment(id, principal.getName());
    }
}
```

### Database Migration

Add this to `backend/src/main/resources/db/migration/` or let Hibernate create it with `ddl-auto=update`:

```sql
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_time TIMESTAMP NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
```

### Testing the Backend

Use Postman/Insomnia to test:

```
1. POST http://localhost:8080/api/v1/appointments
   Headers: Authorization: Bearer {JWT_TOKEN}
   Body: {
     "doctorId": 2,
     "appointmentTime": "2026-04-20T14:00:00",
     "reason": "Regular checkup"
   }

2. GET http://localhost:8080/api/v1/appointments
   Headers: Authorization: Bearer {JWT_TOKEN}

3. GET http://localhost:8080/api/v1/appointments/1
   Headers: Authorization: Bearer {JWT_TOKEN}
```

---

## ISSUE #3: Mobile - Update AuthApi to Include Protected Endpoints

**File:** `mobile/app/src/main/java/com/example/mobile/api/AuthApi.kt`

Add these methods to the interface:

```kotlin
package com.example.mobile.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.LoginRequest
import com.example.mobile.model.RegisterRequest
import retrofit2.Call
import retrofit2.http.*

interface AuthApi {
    @POST("api/v1/auth/register")
    fun register(@Body request: RegisterRequest): Call<ApiEnvelope<AuthResponse>>

    @POST("api/v1/auth/login")
    fun login(@Body request: LoginRequest): Call<ApiEnvelope<AuthResponse>>

    @POST("api/v1/auth/logout")
    fun logout(): Call<Void>

    @GET("api/v1/auth/me")
    fun getMe(): Call<ApiEnvelope<UserDto>>

    // ✨ NEW: Appointment endpoints
    @GET("api/v1/appointments")
    fun getAppointments(): Call<ApiEnvelope<List<AppointmentDto>>>

    @POST("api/v1/appointments")
    fun createAppointment(@Body request: CreateAppointmentRequest): Call<ApiEnvelope<AppointmentDto>>

    @GET("api/v1/appointments/{id}")
    fun getAppointment(@Path("id") id: Long): Call<ApiEnvelope<AppointmentDto>>

    @PUT("api/v1/appointments/{id}")
    fun updateAppointment(@Path("id") id: Long, @Body request: CreateAppointmentRequest): Call<ApiEnvelope<AppointmentDto>>

    @DELETE("api/v1/appointments/{id}")
    fun deleteAppointment(@Path("id") id: Long): Call<Void>
}

// ✨ NEW DTOs for mobile
data class UserDto(
    val id: Long,
    val email: String,
    val fullName: String,
    val role: String
)

data class AppointmentDto(
    val id: Long,
    val patientName: String,
    val patientEmail: String,
    val doctorName: String,
    val doctorEmail: String,
    val appointmentTime: String,
    val reason: String,
    val status: String
)

data class CreateAppointmentRequest(
    val doctorId: Long,
    val appointmentTime: String,
    val reason: String
)
```

---

## SUMMARY

These are the minimum fixes required:

1. ✅ **ApiClient.kt** - Add Authorization interceptor (30 min)
2. ✅ **Backend** - Create Appointment module (4-6 hours)  
3. ✅ **AuthApi.kt** - Add new protected endpoints (30 min)
4. ⏳ **DashboardActivity** - Add role-based navigation (2-3 hours)
5. ⏳ **AppointmentListActivity** - Display appointments (2-3 hours)

After these changes, rebuild and test everything end-to-end.
