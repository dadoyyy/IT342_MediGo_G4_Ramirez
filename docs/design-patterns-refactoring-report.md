# Design Patterns Refactoring Report (MediGo)

## Project Context
- Stack: Spring Boot backend, React frontend, mobile client
- Java version used: 17 (unchanged)
- Branch: feature/design-patterns-refactor

## Before vs After

### Original Implementation (Before)
- User creation logic was directly coded in AuthService methods.
- User entity to DTO/response mapping was duplicated in multiple methods.
- Role handling used inline conditional checks in controller/service flow.
- Authentication side effects (audit/log hooks) were tightly tied to service flow.

### Problems in Original Code
- Duplication in mapping and object construction.
- Higher coupling between service logic and data transformation.
- Harder extensibility for new roles and auth-related side effects.
- More maintenance effort when changing user/auth rules.

### Refactored Implementation (After)
- Factory Pattern: centralized local/google user creation.
- Adapter Pattern: centralized User -> UserDto/AuthResponse mapping.
- Strategy Pattern: role-specific logic split into replaceable strategies.
- Observer Pattern: auth events published; listener handles decoupled reaction.
- Singleton usage: strategy resolver is singleton-scoped via Spring.
- MVC structure preserved and reinforced by cleaner service/controller boundaries.

## Applied Patterns

## 1) Factory Pattern
- Name: Factory Pattern
- Where applied:
  - UserFactory interface
  - DefaultUserFactory implementation
- Justification:
  - Consolidates user construction logic used by multiple auth flows.
- Improvement:
  - Better reuse and cleaner service methods.

### Snippet
```java
User user = userFactory.createLocalUser(request, passwordEncoder.encode(request.getPassword()));
```

## 2) Adapter Pattern
- Name: Adapter Pattern
- Where applied:
  - UserAuthAdapter interface
  - DefaultUserAuthAdapter implementation
- Justification:
  - Converts internal User entity into API-safe DTO/response models.
- Improvement:
  - Removes duplicate mapping code and improves consistency.

### Snippet
```java
return userAuthAdapter.toAuthResponse(saved, token);
```

## 3) Strategy Pattern
- Name: Strategy Pattern
- Where applied:
  - UserRoleStrategy interface
  - PatientRoleStrategy and DoctorRoleStrategy
  - UserRoleStrategyResolver
- Justification:
  - Replaces hard-coded role conditions with interchangeable strategies.
- Improvement:
  - Easy to add future roles without modifying controller/service logic.

### Snippet
```java
String role = userRoleStrategyResolver.resolveNormalizedRole(body.getRole());
```

## 4) Observer Pattern
- Name: Observer Pattern
- Where applied:
  - AuthEvent record + AuthEventType enum
  - AuthEventListener with @EventListener
  - Event publishing from AuthService
- Justification:
  - Decouples authentication actions from side effects (audit hooks).
- Improvement:
  - Better scalability for notifications/audit/analytics integrations.

### Snippet
```java
eventPublisher.publishEvent(new AuthEvent(saved.getEmail(), saved.getRole(), AuthEventType.REGISTER));
```

## 5) Singleton Pattern
- Name: Singleton Pattern
- Where applied:
  - UserRoleStrategyResolver is configured as singleton-scoped Spring bean.
- Justification:
  - One shared resolver instance is enough and avoids unnecessary object creation.
- Improvement:
  - Consistent role resolution behavior and lower overhead.

## 6) MVC (Structural)
- Name: Model-View-Controller
- Where applied:
  - Model: User entity and repository
  - Controller: AuthController
  - Service domain logic: AuthService
- Justification:
  - Keeps request handling, business logic, and data concerns separated.
- Improvement:
  - Better maintainability and clearer project organization.

## Verification
- Java version remained unchanged at 17.
- Backend compilation succeeded after refactor.
- Current test run failed in `MedigoApplicationTests.contextLoads` due to missing JDBC dialect/data source configuration in test environment, not due to this refactor.

## Changed Files (Core)
- backend/src/main/java/edu/cit/ramirez/medigo/service/AuthService.java
- backend/src/main/java/edu/cit/ramirez/medigo/controller/AuthController.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/factory/UserFactory.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/factory/DefaultUserFactory.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/adapter/UserAuthAdapter.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/adapter/DefaultUserAuthAdapter.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/strategy/UserRoleStrategy.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/strategy/PatientRoleStrategy.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/strategy/DoctorRoleStrategy.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/strategy/UserRoleStrategyResolver.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/observer/AuthEvent.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/observer/AuthEventType.java
- backend/src/main/java/edu/cit/ramirez/medigo/patterns/observer/AuthEventListener.java

## Note for Submission
Export this file and the research file as PDF for submission.
