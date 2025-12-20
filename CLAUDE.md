# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based screen recording with audio commentary tool, featuring a Vue 3 + TypeScript frontend and Spring Boot backend.

**Frontend**: Vue 3 with TypeScript, Vite, Pinia for state management, Vue Router for routing
**Backend**: Spring Boot 4.0.1, Java 21, Maven, JPA with MariaDB, Lombok

## Frontend (frontend/)

### Development Commands

```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start development server with hot reload
npm run build                  # Type check and build for production
npm run type-check             # Run TypeScript type checking only
npm run lint                   # Lint and auto-fix with ESLint
npm run format                 # Format code with Prettier
```

### Testing Commands

```bash
# Unit tests (Vitest)
npm run test:unit              # Run unit tests

# E2E tests (Playwright)
npx playwright install         # First-time setup: install browsers
npm run test:e2e               # Run all e2e tests
npm run test:e2e -- --project=chromium  # Run on specific browser
npm run test:e2e -- tests/example.spec.ts  # Run specific test file
npm run test:e2e -- --debug    # Run in debug mode
```

### Architecture

- **State Management**: Uses Pinia (stores in `src/stores/`)
- **Routing**: Vue Router configuration in `src/router/`
- **Path Aliases**: `@` is aliased to `src/` directory (configured in vite.config.ts)
- **TypeScript**: Uses vue-tsc for type checking Vue components
- **Node Version**: Requires Node.js ^20.19.0 or >=22.12.0

## Backend (backend/)

### Development Commands

```bash
cd backend
./mvnw clean install           # Build project and run tests
./mvnw spring-boot:run         # Run the application
./mvnw test                    # Run tests only
./mvnw clean                   # Clean build artifacts
```

On Windows, use `mvnw.cmd` instead of `./mvnw`.

### Architecture

- **Framework**: Spring Boot 4.0.1 with Spring MVC
- **Java Version**: Java 21
- **Build Tool**: Maven (wrapper included)
- **Database**: MariaDB with Spring Data JPA
- **Code Generation**: Uses Lombok for boilerplate reduction
- **Monitoring**: Spring Boot Actuator enabled
- **Package Structure**: Root package is `com.oglimmer.vmsg`
- **Configuration**: Application settings in `src/main/resources/application.yaml`

### Running Tests

Backend tests follow Spring Boot testing conventions using `@SpringBootTest` and related annotations.

## Project Structure

```
video-msg/
├── frontend/           # Vue 3 + TypeScript SPA
│   ├── src/
│   │   ├── router/    # Vue Router configuration
│   │   ├── stores/    # Pinia state management
│   │   └── __tests__/ # Unit tests
│   └── e2e/           # Playwright e2e tests
└── backend/           # Spring Boot REST API
    └── src/
        ├── main/java/com/oglimmer/vmsg/
        └── test/      # Backend tests
```

## Development Workflow

The frontend and backend are separate projects with independent build processes. Run them in separate terminals during development:

Terminal 1: `cd frontend && npm run dev`
Terminal 2: `cd backend && ./mvnw spring-boot:run`
