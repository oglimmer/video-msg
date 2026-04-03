// Migrated from: Recording.java, ProcessingStatus.java, RecordingResponse.java, RecordingDetailResponse.java
package domain

import (
	"database/sql"
	"time"
)

type ProcessingStatus string

const (
	ProcessingStatusProcessing ProcessingStatus = "PROCESSING"
	ProcessingStatusReady      ProcessingStatus = "READY"
	ProcessingStatusFailed     ProcessingStatus = "FAILED"
)

type Recording struct {
	ID               int64
	UUID             string
	Filename         string
	FilePath         string
	FileSize         int64
	ContentType      string
	Duration         sql.NullInt64
	ProcessingStatus ProcessingStatus
	ProcessingError  sql.NullString
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type RecordingResponse struct {
	UUID             string           `json:"uuid"`
	Filename         string           `json:"filename"`
	FileSize         int64            `json:"fileSize"`
	ContentType      string           `json:"contentType"`
	ProcessingStatus ProcessingStatus `json:"processingStatus"`
	CreatedAt        string           `json:"createdAt"`
}

type RecordingDetailResponse struct {
	UUID             string           `json:"uuid"`
	Filename         string           `json:"filename"`
	FileSize         int64            `json:"fileSize"`
	ContentType      string           `json:"contentType"`
	ProcessingStatus ProcessingStatus `json:"processingStatus"`
	CreatedAt        string           `json:"createdAt"`
	Duration         *int64           `json:"duration"`
	ProcessingError  *string          `json:"processingError"`
}

func ToRecordingResponse(r *Recording) RecordingResponse {
	return RecordingResponse{
		UUID:             r.UUID,
		Filename:         r.Filename,
		FileSize:         r.FileSize,
		ContentType:      r.ContentType,
		ProcessingStatus: r.ProcessingStatus,
		CreatedAt:        r.CreatedAt.Format("2006-01-02T15:04:05"),
	}
}

func ToRecordingDetailResponse(r *Recording) RecordingDetailResponse {
	resp := RecordingDetailResponse{
		UUID:             r.UUID,
		Filename:         r.Filename,
		FileSize:         r.FileSize,
		ContentType:      r.ContentType,
		ProcessingStatus: r.ProcessingStatus,
		CreatedAt:        r.CreatedAt.Format("2006-01-02T15:04:05"),
	}
	if r.Duration.Valid {
		resp.Duration = &r.Duration.Int64
	}
	if r.ProcessingError.Valid {
		resp.ProcessingError = &r.ProcessingError.String
	}
	return resp
}
