package service

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetFileExtension(t *testing.T) {
	tests := []struct {
		filename string
		expected string
	}{
		{"video.webm", ".webm"},
		{"video.mp4", ".mp4"},
		{"video", ".webm"},
		{"", ".webm"},
		{"video.tar.gz", ".gz"},
	}
	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			assert.Equal(t, tt.expected, getFileExtension(tt.filename))
		})
	}
}

func TestSaveFile(t *testing.T) {
	tmpDir := t.TempDir()
	svc := NewFileStorageService(tmpDir)

	content := "fake video data"
	reader := strings.NewReader(content)

	relPath, err := svc.SaveFile(reader, "test.webm", "test-uuid-1234")
	require.NoError(t, err)

	assert.Contains(t, relPath, "test-uuid-1234.webm")
	// Check file was written
	absPath := filepath.Join(tmpDir, relPath)
	data, err := os.ReadFile(absPath)
	require.NoError(t, err)
	assert.Equal(t, content, string(data))
}

func TestGetFileSize(t *testing.T) {
	tmpDir := t.TempDir()
	svc := NewFileStorageService(tmpDir)

	content := "some content here"
	reader := strings.NewReader(content)
	relPath, err := svc.SaveFile(reader, "test.webm", "uuid-size-test")
	require.NoError(t, err)

	size, err := svc.GetFileSize(relPath)
	require.NoError(t, err)
	assert.Equal(t, int64(len(content)), size)
}

func TestFileExists(t *testing.T) {
	tmpDir := t.TempDir()
	svc := NewFileStorageService(tmpDir)

	assert.False(t, svc.FileExists("nonexistent/file.webm"))

	content := "data"
	reader := strings.NewReader(content)
	relPath, err := svc.SaveFile(reader, "test.webm", "uuid-exists")
	require.NoError(t, err)

	assert.True(t, svc.FileExists(relPath))
}
