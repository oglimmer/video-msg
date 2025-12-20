# Screen Recording with Audio Commentary

A web-based screen recording with audio commentary tool built with Vue 3 and Spring Boot.

## Tech Stack

### Frontend
- **Vue 3** with TypeScript
- **Vite** for build tooling and development server
- **Pinia** for state management
- **Vue Router** for routing
- **Vitest** for unit testing
- **Playwright** for end-to-end testing

### Backend
- **Spring Boot 4.0.1** with Spring MVC
- **Java 21**
- **Maven** for build management
- **Spring Data JPA** with MariaDB
- **Lombok** for code generation
- **Spring Boot Actuator** for monitoring

## Prerequisites

- **Node.js**: ^20.19.0 or >=22.12.0
- **Java**: JDK 21
- **MariaDB**: Latest stable version
- **Maven**: Included via Maven Wrapper

## Project Structure

```
video-msg/
├── frontend/              # Vue 3 + TypeScript SPA
│   ├── src/
│   │   ├── router/       # Vue Router configuration
│   │   ├── stores/       # Pinia state management
│   │   └── __tests__/    # Unit tests
│   ├── e2e/              # Playwright e2e tests
│   └── package.json
└── backend/              # Spring Boot REST API
    ├── src/
    │   ├── main/java/com/oglimmer/vmsg/
    │   └── test/         # Backend tests
    └── pom.xml
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd video-msg
```

### 2. Setup Database

Create a MariaDB database and configure the connection in `backend/src/main/resources/application.yaml`.

### 3. Backend Setup

```bash
cd backend
./mvnw clean install
```

On Windows, use `mvnw.cmd` instead of `./mvnw`.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

For Playwright e2e tests (first time only):
```bash
npx playwright install
```

## Running the Application

### Development Mode

Run the frontend and backend in separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will typically be available at `http://localhost:5173` and the backend at `http://localhost:8080`.

## Development Commands

### Frontend

```bash
cd frontend

# Development
npm run dev                    # Start development server with hot reload
npm run build                  # Type check and build for production
npm run type-check             # Run TypeScript type checking only

# Code Quality
npm run lint                   # Lint and auto-fix with ESLint
npm run format                 # Format code with Prettier

# Testing
npm run test:unit              # Run unit tests (Vitest)
npm run test:e2e               # Run all e2e tests (Playwright)
npm run test:e2e -- --project=chromium  # Run on specific browser
npm run test:e2e -- tests/example.spec.ts  # Run specific test file
npm run test:e2e -- --debug    # Run in debug mode
```

### Backend

```bash
cd backend

# Build & Run
./mvnw clean install           # Build project and run tests
./mvnw spring-boot:run         # Run the application
./mvnw clean                   # Clean build artifacts

# Testing
./mvnw test                    # Run tests only
```

## Configuration

- **Frontend**: Configuration in `frontend/vite.config.ts`
  - Path alias `@` points to `src/` directory
- **Backend**: Configuration in `backend/src/main/resources/application.yaml`
  - Database connection settings
  - Server port and other Spring Boot settings

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
