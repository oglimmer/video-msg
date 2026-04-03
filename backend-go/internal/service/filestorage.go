// Migrated from: FileStorageService.java
package service

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FileStorageService struct {
	baseDirectory string
}

func NewFileStorageService(baseDirectory string) *FileStorageService {
	return &FileStorageService{baseDirectory: baseDirectory}
}

func (s *FileStorageService) SaveFile(src io.Reader, originalFilename string, uuid string) (string, error) {
	now := time.Now()
	dirPath := fmt.Sprintf("%04d/%02d/%02d", now.Year(), int(now.Month()), now.Day())

	targetDir := filepath.Join(s.baseDirectory, dirPath)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory %s: %w", targetDir, err)
	}

	ext := getFileExtension(originalFilename)
	filename := uuid + ext

	targetPath := filepath.Join(targetDir, filename)
	f, err := os.Create(targetPath)
	if err != nil {
		return "", fmt.Errorf("failed to create file %s: %w", targetPath, err)
	}
	defer f.Close()

	if _, err := io.Copy(f, src); err != nil {
		return "", fmt.Errorf("failed to write file %s: %w", targetPath, err)
	}

	relativePath := dirPath + "/" + filename
	slog.Info("Saved file", "path", relativePath)
	return relativePath, nil
}

func (s *FileStorageService) GetAbsolutePath(filePath string) string {
	return filepath.Join(s.baseDirectory, filePath)
}

func (s *FileStorageService) GetFileSize(filePath string) (int64, error) {
	absPath := filepath.Join(s.baseDirectory, filePath)
	info, err := os.Stat(absPath)
	if err != nil {
		return 0, err
	}
	return info.Size(), nil
}

func (s *FileStorageService) FileExists(filePath string) bool {
	absPath := filepath.Join(s.baseDirectory, filePath)
	info, err := os.Stat(absPath)
	return err == nil && !info.IsDir()
}

func getFileExtension(filename string) string {
	if filename == "" {
		return ".webm"
	}
	lastDot := strings.LastIndex(filename, ".")
	if lastDot > 0 && lastDot < len(filename)-1 {
		return filename[lastDot:]
	}
	return ".webm"
}
