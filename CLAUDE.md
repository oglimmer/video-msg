# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based screen recording with audio commentary tool, featuring a Vue 3 + TypeScript frontend and Go backend.

**Frontend**: Vue 3 with TypeScript, Vite, Pinia for state management, Vue Router for routing
**Backend**: Go with chi router, database/sql with MariaDB, golang-migrate, FFmpeg for video re-encoding

> **Note**: `backend/` contains the original Spring Boot backend, which is deprecated and resource-heavy (requires 2 CPU / 4 GB RAM vs 1 CPU / 512 MB for Go). All active backend development is in `backend-go/`.

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

## Backend (backend-go/)

### Development Commands

```bash
cd backend-go
go build ./...                 # Build all packages
go run ./cmd/server            # Run the application
go test ./...                  # Run all tests
go test ./... -v               # Run tests with verbose output
go vet ./...                   # Run static analysis
```

### Architecture

- **Language**: Go 1.26+
- **HTTP Router**: chi/v5
- **Database**: MariaDB via database/sql + go-sql-driver/mysql
- **Migrations**: golang-migrate (SQL files in `migrations/`)
- **Video Processing**: FFmpeg (VP9 + Opus re-encoding, runs async in goroutines)
- **Configuration**: Environment variables (DATABASE_DSN, FILE_STORAGE_BASE_DIRECTORY, SERVER_PORT, CORS_ALLOWED_ORIGIN)
- **API Base Path**: `/api` (all routes mounted under this prefix)
- **Health Endpoint**: `/api/actuator/health` (compatible with existing K8s/Docker health checks)

### Package Structure

- `cmd/server/` — Entry point, dependency wiring, graceful shutdown
- `internal/config/` — Environment variable configuration
- `internal/domain/` — Domain models and DTOs
- `internal/errors/` — Error types and JSON error responses
- `internal/handler/` — HTTP handlers and middleware (CORS, recovery)
- `internal/repository/` — Database access layer (raw SQL)
- `internal/service/` — Business logic (recording, file storage, video processing, re-encoding)

## Backend (backend/) — Deprecated

> The Spring Boot backend is kept for reference only. Do not use for new development.

## Project Structure

```
video-msg/
├── frontend/           # Vue 3 + TypeScript SPA
│   ├── src/
│   │   ├── router/    # Vue Router configuration
│   │   ├── stores/    # Pinia state management
│   │   └── __tests__/ # Unit tests
│   └── e2e/           # Playwright e2e tests
├── backend-go/         # Go REST API (active)
│   ├── cmd/server/    # Entry point
│   ├── internal/      # Handlers, services, repository
│   └── migrations/    # SQL schema migrations
└── backend/           # Spring Boot REST API (deprecated)
```

## Development Workflow

The frontend and backend are separate projects with independent build processes. Run them in separate terminals during development:

Terminal 1: `cd frontend && npm run dev`
Terminal 2: `cd backend-go && go run ./cmd/server`
