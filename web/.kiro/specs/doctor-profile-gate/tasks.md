# Implementation Plan: Doctor Profile Gate

## Overview

Add a lightweight access-control layer that restricts doctors with incomplete profiles to `/doctor/profile`. The implementation introduces one new file (`DoctorProfileContext.jsx`) and makes targeted edits to `App.jsx`, `AppShell.jsx`, and `DoctorProfile.jsx`. Patient routes are completely unaffected.

## Tasks

- [x] 1. Create `DoctorProfileContext.jsx` with provider, guard, and hook
  - Create `src/features/doctor/context/DoctorProfileContext.jsx`
  - Define `DoctorProfileContext` with `createContext(null)`
  - Implement `DoctorProfileProvider` component:
    - Call `doctorApi.getMyProfile()` on mount inside a `useEffect`
    - Set `isProfileComplete = true` when `profile.specialization` is a non-empty string
    - Set `isProfileComplete = false` on API error, missing profile, or empty/null specialization
    - Manage `isLoading` boolean (starts `true`, set to `false` in `finally`)
    - Expose `{ isProfileComplete, isLoading, markProfileComplete }` via context value
    - `markProfileComplete` sets `isProfileComplete = true` synchronously with no API call
  - Implement `ProfileCompletionGuard` component:
    - Read `{ isProfileComplete, isLoading }` from `DoctorProfileContext` via `useContext`
    - While `isLoading === true`: render a centered spinner matching the existing app spinner style (`w-8 h-8 rounded-full border-2 animate-spin` with `#2EC4B6` top border)
    - When `isLoading === false && !isProfileComplete`: render `<Navigate to="/doctor/profile" replace />`
    - When `isLoading === false && isProfileComplete`: render `children`
  - Export `useDoctorProfile` hook that throws `'useDoctorProfile must be used within DoctorProfileProvider'` when context is `null`
  - Export `DoctorProfileContext` (the raw context object) for direct `useContext` use in `AppShell`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1, 5.1_

- [x] 2. Update `App.jsx` to wrap doctor routes with the provider and guard
  - Depends on Task 1
  - Import `DoctorProfileProvider` and `ProfileCompletionGuard` from `./features/doctor/context/DoctorProfileContext`
  - Wrap the `/doctor/profile` route: `<ProtectedRoute><DoctorProfileProvider><DoctorProfile /></DoctorProfileProvider></ProtectedRoute>`
  - Wrap the `/doctor/schedule` route: `<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><DoctorSchedule /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>`
  - Wrap the `/chat` route: `<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><ChatInterface /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>`
  - All other routes remain unchanged
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1_

- [x] 3. Update `AppShell.jsx` to lock gated nav items for incomplete doctor profiles
  - Depends on Task 1
  - Import `DoctorProfileContext` (the raw context, not `useDoctorProfile`) from the context file
  - Add `gated: true` to the "My Schedule" and "Messages" entries in `doctorNav`; leave "My Profile" without `gated`
  - Inside the component body, read the context with `useContext(DoctorProfileContext)` and derive: `const isProfileComplete = role === 'DOCTOR' ? (doctorProfileCtx?.isProfileComplete ?? true) : true`
  - In the nav render loop, when `role === 'DOCTOR' && item.gated && !isProfileComplete`:
    - Apply inline styles `{ opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' }` to the nav button
    - Suppress the `onClick` handler (pass `undefined` or a no-op instead of the `navigate` call)
  - When `isProfileComplete` is `true` (or user is not a doctor), render all nav items in their normal interactive state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2_

- [x] 4. Refactor `DoctorProfile.jsx` to use context state instead of local `isNewDoctor`
  - Depends on Task 1
  - Import `useDoctorProfile` from the context file
  - Call `const { isProfileComplete, isLoading, markProfileComplete } = useDoctorProfile()` at the top of the component
  - Remove the `isNewDoctor` state declaration and `setIsNewDoctor` calls
  - Remove the `doctorApi.getMyProfile()` call and its surrounding `try/catch` from the `load()` effect — keep only `authApi.me()` to populate `user` state
  - Remove the local `profileLoading` state; use `isLoading` from context for the full-page loading guard
  - Replace all reads of `isNewDoctor` with `!isProfileComplete`
  - In `handleSave`, replace `setIsNewDoctor(false)` with `markProfileComplete()`
  - The `setTimeout(() => setTab('schedule'), 1200)` block after first save should remain, conditioned on `!isProfileComplete` (i.e., the doctor was previously incomplete)
  - _Requirements: 1.4, 4.1, 4.2, 4.3, 5.2_

- [x] 5. Checkpoint — verify the gate works end-to-end
  - Ensure all existing tests pass
  - Manually verify: a doctor with no specialization is redirected from `/doctor/schedule` to `/doctor/profile`
  - Manually verify: after saving a profile, the sidebar nav items unlock and `/doctor/schedule` is accessible without a page reload
  - Manually verify: patient users see no change in their nav or routing behavior
  - Ask the user if any questions arise before closing out

## Notes

- Tasks 2, 3, and 4 all depend on Task 1 and can be worked in parallel once Task 1 is complete
- No new npm packages are required — only `react`, `react-router-dom`, and existing API utilities are used
- `AppShell` uses `useContext` directly (not `useDoctorProfile`) to avoid throwing when rendered outside a `DoctorProfileProvider` (e.g., for patient users)
- The per-route provider pattern means a fresh `getMyProfile()` call on each doctor route navigation; this is intentional and matches the existing behavior in `Dashboard.jsx`
