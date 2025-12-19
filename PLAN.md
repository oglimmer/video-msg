# Video Message Application - Implementation Plan

## Project Overview
Building a screen recording application with video upload/playback capabilities.

**Tech Stack:**
- Frontend: Vue 3 + TypeScript, Pinia, MediaRecorder API
- Backend: Spring Boot 4.0.1, Java 21, MariaDB, MapStruct
- Storage: Metadata in MariaDB, video files in local filesystem

## Implementation Progress

### Phase 1: Backend Foundation
- [ ] Step 1: Add MapStruct dependencies to pom.xml
- [ ] Step 2: Create backend configuration files
  - [ ] Update application.yaml (datasource, JPA, multipart)
  - [ ] Create FileStorageConfig.java
  - [ ] Create WebConfig.java (CORS)
- [ ] Step 3: Create database layer
  - [ ] Create Recording.java entity
  - [ ] Create RecordingRepository.java
  - [ ] Verify table creation in MariaDB
- [ ] Step 4: Create DTOs and MapStruct mappers
  - [ ] Create RecordingResponse.java
  - [ ] Create RecordingDetailResponse.java
  - [ ] Create RecordingMapper.java interface
  - [ ] Rebuild to generate MapStruct implementation
- [ ] Step 5: Create service layer
  - [ ] Create FileStorageService.java
  - [ ] Create RecordingService.java
  - [ ] Create RecordingNotFoundException.java
  - [ ] Create GlobalExceptionHandler.java

### Phase 2: Backend API
- [ ] Step 6: Create RecordingController
  - [ ] POST /api/recordings (upload)
  - [ ] GET /api/recordings/{uuid} (metadata)
  - [ ] GET /api/recordings/{uuid}/stream (video stream with Range support)
- [ ] Step 7: Backend testing
  - [ ] Start MariaDB with docker compose
  - [ ] Run Spring Boot application
  - [ ] Test upload with curl
  - [ ] Test metadata retrieval
  - [ ] Test video streaming
  - [ ] Verify database entries
  - [ ] Verify file storage

### Phase 3: Frontend Foundation
- [ ] Step 8: Frontend setup
  - [ ] Create types/recording.ts
- [ ] Step 9: API service layer
  - [ ] Create services/api.ts with typed methods
- [ ] Step 10: Pinia store
  - [ ] Create stores/recording.ts
  - [ ] Remove stores/counter.ts

### Phase 4: Frontend UI
- [ ] Step 11: Composables
  - [ ] Create composables/useMediaRecorder.ts
- [ ] Step 12: Components
  - [ ] Create components/RecordingControls.vue
  - [ ] Create components/VideoPlayer.vue
- [ ] Step 13: Views and routing
  - [ ] Create views/RecordView.vue
  - [ ] Create views/WatchView.vue
  - [ ] Update router/index.ts with routes
  - [ ] Update App.vue template

### Phase 5: Integration & Polish
- [ ] Step 14: Integration testing
  - [ ] Start MariaDB
  - [ ] Start backend server
  - [ ] Start frontend dev server
  - [ ] Test full recording → upload → watch flow
  - [ ] Test UUID sharing
  - [ ] Test video playback with seeking
- [ ] Step 15: Final polish
  - [ ] Add loading spinners
  - [ ] Add error notifications
  - [ ] Add copy-to-clipboard for share link
  - [ ] Style UI components
  - [ ] Test on multiple browsers
  - [ ] Test error scenarios

## Technical Decisions
- **Storage**: Metadata in MariaDB, video files in `./video-storage/YYYY/MM/DD/{uuid}.ext`
- **Bean Mapping**: MapStruct for Entity↔DTO conversion
- **File Limits**: None (unlimited file size and duration)
- **Retention**: Forever (no auto-deletion)
- **Video Format**: WebM (VP8/Opus) from MediaRecorder API
- **HTTP Client**: Native fetch API
- **Range Support**: Yes, for video seeking
- **CORS**: localhost:5173 allowed for development

## File Structure

### Backend Files Created
```
backend/src/main/java/com/oglimmer/vmsg/
├── config/
│   ├── FileStorageConfig.java
│   └── WebConfig.java
├── controller/
│   └── RecordingController.java
├── dto/
│   ├── RecordingResponse.java
│   └── RecordingDetailResponse.java
├── entity/
│   └── Recording.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   └── RecordingNotFoundException.java
├── mapper/
│   └── RecordingMapper.java
├── repository/
│   └── RecordingRepository.java
└── service/
    ├── FileStorageService.java
    └── RecordingService.java
```

### Frontend Files Created
```
frontend/src/
├── components/
│   ├── RecordingControls.vue
│   └── VideoPlayer.vue
├── composables/
│   └── useMediaRecorder.ts
├── services/
│   └── api.ts
├── stores/
│   └── recording.ts
├── types/
│   └── recording.ts
└── views/
    ├── RecordView.vue
    └── WatchView.vue
```

## Commands Reference

### Backend
```bash
# Build and install dependencies
cd backend
./mvnw clean install

# Run application
./mvnw spring-boot:run

# Test upload
curl -X POST -F "video=@test.webm" http://localhost:8080/api/recordings

# Get metadata
curl http://localhost:8080/api/recordings/{uuid}

# Download video
curl http://localhost:8080/api/recordings/{uuid}/stream --output downloaded.webm
```

### Frontend
```bash
# Install dependencies
cd frontend
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:unit
npm run test:e2e
```

### Database
```bash
# Start MariaDB
docker compose up -d

# Stop MariaDB
docker compose down

# View logs
docker compose logs mariadb
```

## Notes
- Update this checklist as you complete each step
- Mark items with [x] when completed
- Add any issues or notes encountered below

---
**Started:** <!-- Add date when starting -->
**Completed:** <!-- Add date when finished -->
