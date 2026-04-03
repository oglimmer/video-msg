// Migrated from: RecordingNotFoundException.java, GlobalExceptionHandler.java
package errors

import (
	"encoding/json"
	"net/http"
	"time"
)

type RecordingNotFoundError struct {
	UUID string
}

func (e *RecordingNotFoundError) Error() string {
	return "Recording not found with uuid: " + e.UUID
}

type ErrorResponse struct {
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
	Status    int    `json:"status"`
}

func WriteError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Timestamp: time.Now().Format("2006-01-02T15:04:05.000+00:00"),
		Message:   message,
		Status:    status,
	})
}
