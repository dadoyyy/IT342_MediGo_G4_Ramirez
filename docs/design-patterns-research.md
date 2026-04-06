# Software Design Patterns Research (MediGo)

## 1. Factory Pattern
- Category: Creational
- Problem it solves:
Object creation scattered across services causes duplication and tight coupling.
- How it works:
A factory class centralizes and standardizes object creation logic.
- Real-world example:
A healthcare app creates Patient, Doctor, or Admin accounts from one registration flow.
- Possible use case in MediGo:
Create user entities for local registration and Google OAuth registration from one factory interface.

## 2. Singleton Pattern
- Category: Creational
- Problem it solves:
Multiple instances of stateful/shared components can cause inconsistent behavior.
- How it works:
A class exposes one shared instance and a single access point.
- Real-world example:
Authentication token manager shared across all API requests.
- Possible use case in MediGo:
Use singleton-scoped Spring components for role strategy resolution and security utilities.

## 3. Adapter Pattern
- Category: Structural
- Problem it solves:
Internal entity structures and external API response models often differ.
- How it works:
An adapter translates one interface/model into another expected by clients.
- Real-world example:
Convert DB entity objects into safe API DTOs.
- Possible use case in MediGo:
Convert User entity objects into UserDto and AuthResponse objects in one adapter.

## 4. Model-View-Controller (MVC)
- Category: Structural
- Problem it solves:
Mixing request handling, business logic, and data concerns creates hard-to-maintain code.
- How it works:
Model stores data, Controller handles requests, Service/Domain executes business logic, and View exposes output.
- Real-world example:
Spring Boot REST backend with controllers, services, and entities.
- Possible use case in MediGo:
Already used via Controller (REST endpoints), Model (JPA entities), and response layer for API output.

## 5. Observer Pattern
- Category: Behavioral
- Problem it solves:
When an event occurs, multiple reactions should happen without hardcoding dependencies.
- How it works:
A subject publishes events; observers subscribe and react independently.
- Real-world example:
Account registration triggers audit logs, notifications, and analytics.
- Possible use case in MediGo:
Publish authentication events for login/registration and let listeners handle logs and future notifications.

## 6. Strategy Pattern
- Category: Behavioral
- Problem it solves:
Large condition chains for interchangeable behavior increase complexity.
- How it works:
Encapsulate algorithms in separate strategy classes and resolve at runtime.
- Real-world example:
Different payment or role-handling rules selected dynamically.
- Possible use case in MediGo:
Role validation/normalization through separate strategies for PATIENT and DOCTOR.

## Summary
The selected patterns improve MediGo by reducing conditional complexity, centralizing object creation and mapping, and enabling extensible event-driven behavior.
