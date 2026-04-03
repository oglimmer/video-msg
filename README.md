# Screen Recording with Audio Commentary

A web-based screen recording with audio commentary tool built with Vue 3 and Go.

## Tech Stack

### Frontend
- **Vue 3** with TypeScript
- **Vite** for build tooling and development server
- **Pinia** for state management
- **Vue Router** for routing
- **Vitest** for unit testing
- **Playwright** for end-to-end testing

### Backend (Go) — `backend-go/`
- **Go** with chi router
- **MariaDB** via `database/sql` + `go-sql-driver/mysql`
- **golang-migrate** for schema migrations
- **FFmpeg** for video re-encoding (VP9 + Opus)

### Backend (Spring Boot) — `backend/` (deprecated)
> **Deprecated.** The original Spring Boot backend is kept for reference but is no longer actively developed or deployed. It requires significantly more resources (2 CPU / 4 GB RAM) compared to the Go backend (1 CPU / 512 MB RAM).

## Prerequisites

- **Node.js**: ^20.19.0 or >=22.12.0
- **Go**: 1.26+
- **MariaDB**: Latest stable version
- **FFmpeg**: Required for video re-encoding

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
├── backend-go/            # Go REST API (active)
│   ├── cmd/server/       # Entry point
│   ├── internal/         # Handlers, services, repository
│   ├── migrations/       # SQL schema migrations
│   └── Dockerfile
└── backend/               # Spring Boot REST API (deprecated)
    ├── src/
    └── pom.xml
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd video-msg
```

### 2. Setup Database

Start MariaDB using the included compose file:

```bash
docker compose up -d
```

Or create a MariaDB database manually. The Go backend runs migrations automatically on startup.

### 3. Backend Setup

```bash
cd backend-go
go build ./...
```

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
cd backend-go
go run ./cmd/server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will typically be available at `http://localhost:5173` and the backend at `http://localhost:8080`.

### Environment Variables (Backend)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_DSN` | `video-message:video-message@tcp(localhost:3306)/video-message?parseTime=true` | MariaDB connection string |
| `FILE_STORAGE_BASE_DIRECTORY` | `./video-storage` | Video file storage path |
| `SERVER_PORT` | `8080` | HTTP listen port |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

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
cd backend-go

# Build & Run
go build ./...                 # Build all packages
go run ./cmd/server            # Run the application
go vet ./...                   # Run static analysis

# Testing
go test ./...                  # Run all tests
go test ./... -v               # Run tests with verbose output
```

## Configuration

- **Frontend**: Configuration in `frontend/vite.config.ts`
  - Path alias `@` points to `src/` directory
- **Backend**: Configuration via environment variables (see table above)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
