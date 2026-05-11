# Backend Guide: Java + Spring Boot

Use this guide for backend implementation work in Java/Spring Boot projects.

## Stack Assumptions

- Java 17+ (LTS)
- Spring Boot 3.x
- Spring Data JPA + Hibernate for persistence
- PostgreSQL or project-specified database
- Maven or Gradle build system
- JUnit 5 + Mockito for testing

## Architecture Rules

- Follow layered architecture: Controller → Service → Repository
- Controllers handle HTTP concerns only — no business logic
- Services contain all business logic — they are the core of the application
- Repositories handle data access — no query logic in services
- Use constructor injection exclusively — no field injection with `@Autowired`
- One service per domain aggregate, not one per entity

## Controller Rules

- Controllers are thin — accept request, call service, return response
- Use `@RestController` for APIs, return DTOs not entities
- Use `@Valid` on request bodies and path variables for input validation
- Map exceptions to HTTP responses with `@ControllerAdvice` and `@ExceptionHandler`
- Keep request/response DTOs as records — immutable, focused
- Use `ResponseEntity` for explicit control over status codes and headers

## Service Rules

- Services are stateless — all state lives in the database or is passed as parameters
- Use `@Transactional` on service methods that modify data, not on repositories
- Throw domain-specific exceptions from services — never HTTP exceptions
- Avoid service-to-service circular dependencies — extract shared logic to a domain service
- Keep methods focused — one public method per business operation

## Repository Rules

- Use Spring Data JPA interfaces — do not implement `JpaRepository` methods manually
- Custom queries use `@Query` with JPQL or native SQL, placed on the repository interface
- Pagination and sorting use `Pageable` parameters — do not implement manually
- Complex queries that span aggregates go in a dedicated query service, not the repository
- Always use `Optional` for single-entity lookups — never return null

## Entity Rules

- Entities model database tables — not business logic
- Use `@Entity` and JPA annotations on the entity class, not on a superclass
- Prefer `Long` or `UUID` for primary keys
- Use `@Enumerated(EnumType.STRING)` for enums — never `ORDINAL`
- Lazy-load `@OneToMany` and `@ManyToMany` relationships by default
- Override `equals` and `hashCode` based on the business key, not the ID

## Testing Rules

- Unit tests for services — mock repositories and external dependencies
- Integration tests for controllers — use `@WebMvcTest` with `MockMvc`
- Integration tests for repositories — use `@DataJpaTest` with a test database
- Use `@SpringBootTest` sparingly — only for full application context tests
- Test names use `should_expectedBehavior_when_condition` pattern

## Workflow

1. Define the entity and repository
2. Create the request/response DTOs (as records)
3. Implement the service with business logic
4. Wire the controller to the service
5. Add validation annotations on DTOs
6. Add exception handling in `@ControllerAdvice`
7. Write unit tests for service, integration tests for controller

## Self-Check

1. No business logic in controllers or repositories
2. All injection is constructor-based, not field-based
3. `@Transactional` is on service methods, not repository methods
4. DTOs are records, not entities exposed to the API
5. Exception handling uses `@ControllerAdvice`, not try-catch in controllers
6. Enums use `STRING` mapping, not `ORDINAL`
7. Tests cover service logic and API contract
