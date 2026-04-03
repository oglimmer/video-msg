// Migrated from: RecordingController.java
package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	apperrors "github.com/oglimmer/vmsg/internal/errors"
	"github.com/oglimmer/vmsg/internal/service"
)

type RecordingHandler struct {
	recordingService *service.RecordingService
}

func NewRecordingHandler(recordingService *service.RecordingService) *RecordingHandler {
	return &RecordingHandler{recordingService: recordingService}
}

func (h *RecordingHandler) Routes(r chi.Router) {
	r.Post("/recordings", h.uploadRecording)
	r.Get("/recordings/{uuid}", h.getRecording)
	r.Get("/recordings/{uuid}/stream", h.streamRecording)
}

func (h *RecordingHandler) uploadRecording(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("video")
	if err != nil {
		apperrors.WriteError(w, http.StatusBadRequest, "Failed to read video file: "+err.Error())
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "video/webm"
	}

	resp, err := h.recordingService.UploadRecording(r.Context(), file, header.Filename, header.Size, contentType)
	if err != nil {
		slog.Error("Error uploading recording", "error", err)
		apperrors.WriteError(w, http.StatusInternalServerError, "Failed to upload recording")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (h *RecordingHandler) getRecording(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	resp, err := h.recordingService.GetRecordingByUUID(r.Context(), uuid)
	if err != nil {
		if isNotFound(err) {
			apperrors.WriteError(w, http.StatusNotFound, err.Error())
			return
		}
		slog.Error("Error getting recording", "error", err)
		apperrors.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *RecordingHandler) streamRecording(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	slog.Info("Stream request received", "uuid", uuid, "range", r.Header.Get("Range"))

	recording, err := h.recordingService.GetRecordingEntityByUUID(r.Context(), uuid)
	if err != nil {
		if isNotFound(err) {
			apperrors.WriteError(w, http.StatusNotFound, err.Error())
			return
		}
		slog.Error("Error getting recording", "error", err)
		apperrors.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	slog.Info("Found recording", "uuid", recording.UUID, "filePath", recording.FilePath)

	if !h.recordingService.FileExists(recording) {
		slog.Error("Resource does not exist", "uuid", uuid, "path", recording.FilePath)
		apperrors.WriteError(w, http.StatusNotFound, "Video file does not exist for recording: "+uuid)
		return
	}

	absPath := h.recordingService.GetFilePath(recording)
	file, err := os.Open(absPath)
	if err != nil {
		slog.Error("IO error while preparing to stream", "uuid", uuid, "error", err)
		apperrors.WriteError(w, http.StatusNotFound, "Failed to access video file for recording: "+uuid+" - "+err.Error())
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		slog.Error("Failed to stat file", "uuid", uuid, "error", err)
		apperrors.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Parse content type safely - strip codecs if parsing fails
	contentType := recording.ContentType
	if _, _, err := mime.ParseMediaType(contentType); err != nil {
		baseType := strings.Split(contentType, ";")[0]
		contentType = strings.TrimSpace(baseType)
		slog.Warn("Failed to parse full content type, using base type", "original", recording.ContentType, "base", contentType)
	}

	// Match Spring behavior: always return 200 with full content, ignoring Range header
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size()))

	slog.Info("Returning full content", "bytes", stat.Size())
	io.Copy(w, file)
}

func isNotFound(err error) bool {
	_, ok := err.(*apperrors.RecordingNotFoundError)
	return ok
}
