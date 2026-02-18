# MediGo

MediGo is an appointment booking MVP for healthcare that lets patients and doctors search, book, and manage appointments across clinics and hospitals. The project is structured as a multi-module repository with backend, mobile, web, and docs components.

## Goals
- Provide a simple, fast booking experience for patients and doctors.
- Support user registration and authentication (email/password).
- Enable searching, filtering, and listing of hospitals/clinics and doctors.
- Allow booking, cancelling, and managing appointments.
- Provide in-app communication between patients and doctors.
- Deliver a responsive web interface and a mobile (Android) client.

## High-level Architecture
- Backend: Java / Spring Boot (REST API, authentication, appointment logic).
- Mobile: Android (Kotlin) app located in the `mobile` module.
- Web: frontend app in the `web` folder (React / Vite).
- Docs: project documentation and design files.

## Included Features (MVP)
- User registration and authentication (email/password).
- Hospital / clinic listing with search and filter.
- Booking process (book / cancel appointments).
- Appointment types (e.g. check-up, follow-up).
- In-app communication between patients and doctors.
- Responsive web interface and mobile UI.

## Excluded / Future Features
- Email notification system (not included in MVP).
- Push notifications (can be added later).

## Repo Structure
- `backend/` — Spring Boot service and API.
- `mobile/` — Android application (module may contain its own IntelliJ/Android Studio settings).
- `web/` — React frontend.
- `docs/` — design documents and requirements.

## Quick Setup
1. Backend

```bash
cd backend
./mvnw spring-boot:run
```

2. Mobile (Android)

Open the `mobile` folder in Android Studio and run on an emulator or device.

3. Web

```bash
cd web
npm install
npm run dev
```

## Notes about IDE files
- The repository contains a root `.idea` (project-wide) and a `mobile/.idea` (module/local) folder. Keep only the root `.idea` if you want a single multi-module IDE project; add `mobile/.idea/` to `.gitignore` if you prefer that.

## How to Contribute
- Create a feature branch, implement changes, push to origin, and open a Pull Request targeting `main`.

## Contact
For questions, open an issue or contact the project maintainer.

---
This README is an initial draft created from the project's requirement notes; we'll iterate as the project evolves.
