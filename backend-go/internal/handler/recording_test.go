package handler

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/oglimmer/vmsg/internal/domain"
	"github.com/oglimmer/vmsg/internal/repository"
	"github.com/oglimmer/vmsg/internal/service"
)

// mockRecordingRepository implements repository.RecordingRepository for testing
type mockRecordingRepository struct {
	recordings map[string]*domain.Recording
}

func newMockRepo() *mockRecordingRepository {
	return &mockRecordingRepository{recordings: make(map[string]*domain.Recording)}
}

func (m *mockRecordingRepository) Save(_ context.Context, r *domain.Recording) error {
	r.ID = int64(len(m.recordings) + 1)
	m.recordings[r.UUID] = r
	return nil
}

func (m *mockRecordingRepository) FindByUUID(_ context.Context, uuid string) (*domain.Recording, error) {
	r, ok := m.recordings[uuid]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *mockRecordingRepository) Update(_ context.Context, r *domain.Recording) error {
	m.recordings[r.UUID] = r
	return nil
}

var _ repository.RecordingRepository = (*mockRecordingRepository)(nil)

func setupTestRouter(t *testing.T) (*chi.Mux, *mockRecordingRepository) {
	t.Helper()
	tmpDir := t.TempDir()

	repo := newMockRepo()
	fileStorage := service.NewFileStorageService(tmpDir)
	reencoder := service.NewVideoReencodingService()
	videoProcessing := service.NewVideoProcessingService(repo, reencoder, fileStorage)
	recordingService := service.NewRecordingService(repo, fileStorage, videoProcessing)
	handler := NewRecordingHandler(recordingService)

	r := chi.NewRouter()
	r.Route("/api", func(r chi.Router) {
		handler.Routes(r)
	})

	return r, repo
}

func TestUploadRecording_Returns201(t *testing.T) {
	router, _ := setupTestRouter(t)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("video", "test.webm")
	require.NoError(t, err)
	_, err = part.Write([]byte("fake video content"))
	require.NoError(t, err)
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/recordings", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp domain.RecordingResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.NotEmpty(t, resp.UUID)
	assert.Equal(t, "test.webm", resp.Filename)
	assert.Equal(t, domain.ProcessingStatusProcessing, resp.ProcessingStatus)
}

func TestGetRecording_Returns200(t *testing.T) {
	router, repo := setupTestRouter(t)

	// Seed a recording
	now := time.Now()
	repo.recordings["test-uuid"] = &domain.Recording{
		ID:               1,
		UUID:             "test-uuid",
		Filename:         "video.webm",
		FilePath:         "2025/01/01/test-uuid.webm",
		FileSize:         1024,
		ContentType:      "video/webm",
		ProcessingStatus: domain.ProcessingStatusReady,
		CreatedAt:        now,
		UpdatedAt:        now,
		Duration:         sql.NullInt64{Int64: 30, Valid: true},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/recordings/test-uuid", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var resp domain.RecordingDetailResponse
	err := json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "test-uuid", resp.UUID)
	assert.Equal(t, "video.webm", resp.Filename)
	assert.Equal(t, domain.ProcessingStatusReady, resp.ProcessingStatus)
	assert.NotNil(t, resp.Duration)
	assert.Equal(t, int64(30), *resp.Duration)
}

func TestGetRecording_Returns404(t *testing.T) {
	router, _ := setupTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/api/recordings/nonexistent", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)

	var errResp map[string]interface{}
	err := json.NewDecoder(rec.Body).Decode(&errResp)
	require.NoError(t, err)
	assert.Contains(t, errResp["message"], "not found")
	assert.Equal(t, float64(404), errResp["status"])
}

func TestStreamRecording_Returns404_WhenNotFound(t *testing.T) {
	router, _ := setupTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/api/recordings/nonexistent/stream", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestStreamRecording_Returns404_WhenFileNotExists(t *testing.T) {
	router, repo := setupTestRouter(t)

	now := time.Now()
	repo.recordings["test-uuid"] = &domain.Recording{
		ID:               1,
		UUID:             "test-uuid",
		Filename:         "video.webm",
		FilePath:         "nonexistent/path/video.webm",
		FileSize:         1024,
		ContentType:      "video/webm",
		ProcessingStatus: domain.ProcessingStatusReady,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	req := httptest.NewRequest(http.MethodGet, "/api/recordings/test-uuid/stream", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestUploadRecording_Returns400_WhenNoFile(t *testing.T) {
	router, _ := setupTestRouter(t)

	req := httptest.NewRequest(http.MethodPost, "/api/recordings", nil)
	req.Header.Set("Content-Type", "multipart/form-data; boundary=xxx")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestStreamRecording_Returns200_WhenFileExists(t *testing.T) {
	router, repo := setupTestRouter(t)

	// First upload a file to get a real path
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("video", "test.webm")
	videoContent := "fake video content for streaming"
	part.Write([]byte(videoContent))
	writer.Close()

	uploadReq := httptest.NewRequest(http.MethodPost, "/api/recordings", body)
	uploadReq.Header.Set("Content-Type", writer.FormDataContentType())
	uploadRec := httptest.NewRecorder()
	router.ServeHTTP(uploadRec, uploadReq)

	var uploadResp domain.RecordingResponse
	json.NewDecoder(uploadRec.Body).Decode(&uploadResp)

	// Update the recording to have correct content type
	recording := repo.recordings[uploadResp.UUID]
	recording.ContentType = "video/webm"
	recording.ProcessingStatus = domain.ProcessingStatusReady

	// Now stream it
	streamReq := httptest.NewRequest(http.MethodGet, "/api/recordings/"+uploadResp.UUID+"/stream", nil)
	streamRec := httptest.NewRecorder()
	router.ServeHTTP(streamRec, streamReq)

	assert.Equal(t, http.StatusOK, streamRec.Code)
	respBody, _ := io.ReadAll(streamRec.Body)
	assert.Equal(t, videoContent, string(respBody))
}
