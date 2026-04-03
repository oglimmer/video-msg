// Migrated from: RecordingService.java
package service

import (
	"context"
	"database/sql"
	"io"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/oglimmer/vmsg/internal/domain"
	apperrors "github.com/oglimmer/vmsg/internal/errors"
	"github.com/oglimmer/vmsg/internal/repository"
)

type RecordingService struct {
	repo            repository.RecordingRepository
	fileStorage     *FileStorageService
	videoProcessing *VideoProcessingService
}

func NewRecordingService(
	repo repository.RecordingRepository,
	fileStorage *FileStorageService,
	videoProcessing *VideoProcessingService,
) *RecordingService {
	return &RecordingService{
		repo:            repo,
		fileStorage:     fileStorage,
		videoProcessing: videoProcessing,
	}
}

func (s *RecordingService) UploadRecording(ctx context.Context, file io.Reader, originalFilename string, fileSize int64, contentType string) (*domain.RecordingResponse, error) {
	recordUUID := uuid.New().String()

	filePath, err := s.fileStorage.SaveFile(file, originalFilename, recordUUID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	recording := &domain.Recording{
		UUID:             recordUUID,
		Filename:         originalFilename,
		FilePath:         filePath,
		FileSize:         fileSize,
		ContentType:      contentType,
		Duration:         sql.NullInt64{Valid: false},
		ProcessingStatus: domain.ProcessingStatusProcessing,
		ProcessingError:  sql.NullString{Valid: false},
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.repo.Save(ctx, recording); err != nil {
		return nil, err
	}

	slog.Info("Recording uploaded successfully, starting async processing", "uuid", recordUUID)

	s.videoProcessing.ProcessVideoAsync(ctx, recordUUID)

	resp := domain.ToRecordingResponse(recording)
	return &resp, nil
}

func (s *RecordingService) GetRecordingByUUID(ctx context.Context, uuid string) (*domain.RecordingDetailResponse, error) {
	recording, err := s.repo.FindByUUID(ctx, uuid)
	if err != nil {
		return nil, err
	}
	if recording == nil {
		return nil, &apperrors.RecordingNotFoundError{UUID: uuid}
	}

	resp := domain.ToRecordingDetailResponse(recording)
	return &resp, nil
}

func (s *RecordingService) GetRecordingEntityByUUID(ctx context.Context, uuid string) (*domain.Recording, error) {
	recording, err := s.repo.FindByUUID(ctx, uuid)
	if err != nil {
		return nil, err
	}
	if recording == nil {
		return nil, &apperrors.RecordingNotFoundError{UUID: uuid}
	}
	return recording, nil
}

func (s *RecordingService) GetFilePath(recording *domain.Recording) string {
	return s.fileStorage.GetAbsolutePath(recording.FilePath)
}

func (s *RecordingService) FileExists(recording *domain.Recording) bool {
	return s.fileStorage.FileExists(recording.FilePath)
}
