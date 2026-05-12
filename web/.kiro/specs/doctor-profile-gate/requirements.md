# Requirements Document

## Introduction

The Doctor Profile Completion Gate is a navigation access-control feature for the MediGo web application. When a doctor registers or logs in without a completed profile, they must be restricted to the profile setup page (`/doctor/profile`) until they fill in the required fields (specialization, clinic name, and clinic address). This prevents newly registered doctors from accessing schedule management or messaging features before their profile is discoverable by patients. The gate must be enforced at both the UI level (sidebar navigation) and the routing level (direct URL navigation).

## Glossary

- **Doctor**: An authenticated user with the role `DOCTOR`.
- **Profile_Completion_State**: The condition of a doctor's profile. A profile is considered **complete** when the `specialization` field is non-empty; otherwise it is **incomplete**.
- **Profile_Gate**: The access-control mechanism that restricts a doctor with an incomplete profile to `/doctor/profile` only.
- **Gated_Route**: Any doctor-accessible route other than `/doctor/profile`, specifically `/doctor/schedule` and `/chat`.
- **AppShell**: The shared sidebar navigation component rendered for all authenticated pages.
- **ProfileCompletionGuard**: A new route-level guard component responsible for redirecting doctors with incomplete profiles away from Gated_Routes.
- **DoctorProfileContext**: A React context (or equivalent shared state) that holds and exposes the doctor's Profile_Completion_State to both the AppShell and routing layer.

---

## Requirements

### Requirement 1: Profile Completion State Detection

**User Story:** As the MediGo system, I want to determine whether a doctor's profile is complete, so that I can enforce or lift access restrictions consistently across the UI and routing layers.

#### Acceptance Criteria

1. WHEN a doctor's profile is loaded, THE DoctorProfileContext SHALL evaluate Profile_Completion_State as **complete** if and only if the `specialization` field returned by `doctorApi.getMyProfile()` is a non-empty string.
2. WHEN a doctor's profile is loaded, THE DoctorProfileContext SHALL evaluate Profile_Completion_State as **incomplete** if the `specialization` field is absent, null, or an empty string.
3. WHEN `doctorApi.getMyProfile()` returns an error or no profile record exists, THE DoctorProfileContext SHALL treat Profile_Completion_State as **incomplete**.
4. THE DoctorProfileContext SHALL expose the Profile_Completion_State to all consumer components without requiring each consumer to make its own API call.

---

### Requirement 2: Route-Level Access Guard

**User Story:** As a doctor with an incomplete profile, I want the application to redirect me to the profile setup page when I try to access restricted routes, so that I cannot bypass the profile gate by typing a URL directly.

#### Acceptance Criteria

1. WHEN a doctor with an incomplete profile navigates to `/doctor/schedule`, THE ProfileCompletionGuard SHALL redirect the doctor to `/doctor/profile`.
2. WHEN a doctor with an incomplete profile navigates to `/chat`, THE ProfileCompletionGuard SHALL redirect the doctor to `/doctor/profile`.
3. WHEN a doctor with a complete profile navigates to any Gated_Route, THE ProfileCompletionGuard SHALL allow the navigation and render the requested page.
4. THE ProfileCompletionGuard SHALL apply only to routes for users with the `DOCTOR` role; patient routes SHALL remain unaffected.
5. WHILE the Profile_Completion_State is being loaded (pending API response) for a user with the `DOCTOR` role, THE ProfileCompletionGuard SHALL not redirect and SHALL display a loading indicator instead of the page content.

---

### Requirement 3: Sidebar Navigation Locking

**User Story:** As a doctor with an incomplete profile, I want the sidebar navigation items for "My Schedule" and "Messages" to be visually disabled and non-interactive, so that I understand I must complete my profile before accessing those sections.

#### Acceptance Criteria

1. WHILE a doctor's Profile_Completion_State is **incomplete**, THE AppShell SHALL render the "My Schedule" nav item exclusively in a visually disabled state (reduced opacity, `not-allowed` cursor) and SHALL NOT render it in a normal interactive state simultaneously.
2. WHILE a doctor's Profile_Completion_State is **incomplete**, THE AppShell SHALL render the "Messages" nav item exclusively in a visually disabled state (reduced opacity, `not-allowed` cursor) and SHALL NOT render it in a normal interactive state simultaneously.
3. WHILE a doctor's Profile_Completion_State is **incomplete**, THE AppShell SHALL prevent click interactions on the "My Schedule" and "Messages" nav items from triggering navigation; WHEN the Profile_Completion_State transitions to **complete**, THE AppShell SHALL immediately lift click prevention on all previously locked nav items simultaneously.
4. WHEN a doctor's Profile_Completion_State is **complete**, THE AppShell SHALL render all nav items in their normal, fully interactive state.
5. THE AppShell SHALL apply nav item locking only when the authenticated user's role is `DOCTOR`; patient nav items SHALL never be locked by this feature.

---

### Requirement 4: Profile Completion Unlocks Access

**User Story:** As a doctor, I want all navigation restrictions to be lifted immediately after I save a complete profile, so that I can proceed to manage my schedule and messages without needing to reload the page.

#### Acceptance Criteria

1. WHEN a doctor successfully saves a profile with a non-empty `specialization`, `clinicName`, and `clinicAddress`, THE DoctorProfileContext SHALL update the Profile_Completion_State to **complete**.
2. WHEN the Profile_Completion_State transitions to **complete**, THE AppShell SHALL immediately re-render the "My Schedule" and "Messages" nav items in their fully interactive state without requiring a full page reload.
3. WHEN the Profile_Completion_State transitions to **complete**, THE ProfileCompletionGuard SHALL immediately permit navigation to Gated_Routes without requiring a full page reload.

---

### Requirement 5: Profile Page Remains Accessible

**User Story:** As a doctor, I want to always be able to access my profile page regardless of completion status, so that I can set up or update my profile at any time.

#### Acceptance Criteria

1. THE ProfileCompletionGuard SHALL never redirect a doctor away from `/doctor/profile`.
2. WHILE a doctor's Profile_Completion_State is **incomplete**, THE AppShell SHALL render the "My Profile" nav item in its normal, fully interactive state, distinct from the disabled state applied to "My Schedule" and "Messages".
3. WHEN a doctor with a complete profile visits `/doctor/profile`, THE ProfileCompletionGuard SHALL allow the navigation and render the profile page normally.
