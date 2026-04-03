// Migrated from: VideoProcessingService.java
package service

import (
	"context"
	"database/sql"
	"log/slog"
	"time"

	"github.com/oglimmer/vmsg/internal/domain"
	"github.com/oglimmer/vmsg/internal/repository"
)

type VideoProcessingService struct {
	repo        repository.RecordingRepository
	reencoder   *VideoReencodingService
	fileStorage *FileStorageService
}

func NewVideoProcessingService(
	repo repository.RecordingRepository,
	reencoder *VideoReencodingService,
	fileStorage *FileStorageService,
) *VideoProcessingService {
	return &VideoProcessingService{
		repo:        repo,
		reencoder:   reencoder,
		fileStorage: fileStorage,
	}
}

func (s *VideoProcessingService) ProcessVideoAsync(_ context.Context, uuid string) {
	go func() {
		// Use a background context — the HTTP request context will be cancelled
		// as soon as the upload response is sent, but processing continues.
		bgCtx := context.Background()

		slog.Info("Starting async video processing", "uuid", uuid)

		if err := s.processVideo(bgCtx, uuid); err != nil {
			slog.Error("Failed to process video", "uuid", uuid, "error", err)
			s.markFailed(bgCtx, uuid, err.Error())
		}
	}()
}

func (s *VideoProcessingService) processVideo(ctx context.Context, uuid string) error {
	recording, err := s.repo.FindByUUID(ctx, uuid)
	if err != nil {
		return err
	}
	if recording == nil {
		return &recordingNotFoundError{uuid: uuid}
	}

	absPath := s.fileStorage.GetAbsolutePath(recording.FilePath)
	if err := s.reencoder.ReencodeVideo(absPath); err != nil {
		return err
	}
	slog.Info("Video re-encoding completed", "uuid", uuid)

	fileSize, err := s.fileStorage.GetFileSize(recording.FilePath)
	if err != nil {
		return err
	}

	recording.FileSize = fileSize
	recording.ContentType = "video/webm"
	recording.ProcessingStatus = domain.ProcessingStatusReady
	recording.ProcessingError = sql.NullString{Valid: false}
	recording.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, recording); err != nil {
		return err
	}

	slog.Info("Recording processing completed successfully", "uuid", uuid)
	return nil
}

func (s *VideoProcessingService) markFailed(ctx context.Context, uuid string, errMsg string) {
	recording, err := s.repo.FindByUUID(ctx, uuid)
	if err != nil {
		slog.Error("Failed to fetch recording for error update", "uuid", uuid, "error", err)
		return
	}
	if recording == nil {
		slog.Error("Recording not found for error update", "uuid", uuid)
		return
	}

	recording.ProcessingStatus = domain.ProcessingStatusFailed
	recording.ProcessingError = sql.NullString{String: errMsg, Valid: true}
	recording.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, recording); err != nil {
		slog.Error("Failed to save error status", "uuid", uuid, "error", err)
	}
}

type recordingNotFoundError struct {
	uuid string
}

func (e *recordingNotFoundError) Error() string {
	return "Recording not found with UUID: " + e.uuid
}
