// Migrated from: RecordingRepository.java
package repository

import (
	"context"
	"database/sql"

	"github.com/oglimmer/vmsg/internal/domain"
)

type RecordingRepository interface {
	Save(ctx context.Context, r *domain.Recording) error
	FindByUUID(ctx context.Context, uuid string) (*domain.Recording, error)
	Update(ctx context.Context, r *domain.Recording) error
}

type recordingRepository struct {
	db *sql.DB
}

func NewRecordingRepository(db *sql.DB) RecordingRepository {
	return &recordingRepository{db: db}
}

func (repo *recordingRepository) Save(ctx context.Context, r *domain.Recording) error {
	result, err := repo.db.ExecContext(ctx,
		`INSERT INTO recording (uuid, filename, file_path, file_size, content_type, duration, processing_status, processing_error, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		r.UUID, r.Filename, r.FilePath, r.FileSize, r.ContentType,
		r.Duration, r.ProcessingStatus, r.ProcessingError,
		r.CreatedAt, r.UpdatedAt,
	)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	r.ID = id
	return nil
}

func (repo *recordingRepository) FindByUUID(ctx context.Context, uuid string) (*domain.Recording, error) {
	r := &domain.Recording{}
	err := repo.db.QueryRowContext(ctx,
		`SELECT id, uuid, filename, file_path, file_size, content_type, duration, processing_status, processing_error, created_at, updated_at
		 FROM recording WHERE uuid = ?`, uuid,
	).Scan(
		&r.ID, &r.UUID, &r.Filename, &r.FilePath, &r.FileSize, &r.ContentType,
		&r.Duration, &r.ProcessingStatus, &r.ProcessingError,
		&r.CreatedAt, &r.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return r, nil
}

func (repo *recordingRepository) Update(ctx context.Context, r *domain.Recording) error {
	_, err := repo.db.ExecContext(ctx,
		`UPDATE recording SET filename=?, file_path=?, file_size=?, content_type=?, duration=?, processing_status=?, processing_error=?, updated_at=?
		 WHERE id=?`,
		r.Filename, r.FilePath, r.FileSize, r.ContentType,
		r.Duration, r.ProcessingStatus, r.ProcessingError,
		r.UpdatedAt, r.ID,
	)
	return err
}
