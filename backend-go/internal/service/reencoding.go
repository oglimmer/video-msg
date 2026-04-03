// Migrated from: VideoReencodingService.java
package service

import (
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type VideoReencodingService struct{}

func NewVideoReencodingService() *VideoReencodingService {
	return &VideoReencodingService{}
}

func (s *VideoReencodingService) ReencodeVideo(videoPath string) error {
	if _, err := os.Stat(videoPath); os.IsNotExist(err) {
		return fmt.Errorf("video file does not exist: %s", videoPath)
	}

	filename := filepath.Base(videoPath)
	var tempFilename string
	if lastDot := strings.LastIndex(filename, "."); lastDot > 0 {
		tempFilename = filename[:lastDot] + "_tmp" + filename[lastDot:]
	} else {
		tempFilename = filename + "_tmp"
	}
	tempPath := filepath.Join(filepath.Dir(videoPath), tempFilename)

	args := []string{
		"-y",
		"-fflags", "+genpts",
		"-i", videoPath,
		"-c:v", "libvpx-vp9",
		"-b:v", "1M",
		"-crf", "31",
		"-maxrate", "1.5M",
		"-bufsize", "2M",
		"-c:a", "libopus",
		"-b:a", "128k",
		"-vbr", "on",
		"-f", "webm",
		"-avoid_negative_ts", "make_zero",
		tempPath,
	}

	slog.Info("Re-encoding video file", "filename", filename)
	slog.Debug("ffmpeg command", "args", strings.Join(append([]string{"ffmpeg"}, args...), " "))

	cmd := exec.Command("ffmpeg", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		os.Remove(tempPath)
		if exitErr, ok := err.(*exec.ExitError); ok {
			return fmt.Errorf("ffmpeg re-encoding failed with exit code %d: %s", exitErr.ExitCode(), string(output))
		}
		return fmt.Errorf("ffmpeg re-encoding failed: %w", err)
	}

	// Replace original with re-encoded file
	if err := os.Remove(videoPath); err != nil {
		os.Remove(tempPath)
		return fmt.Errorf("failed to remove original file: %w", err)
	}
	if err := os.Rename(tempPath, videoPath); err != nil {
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	slog.Info("Successfully re-encoded video file", "filename", filename)
	return nil
}
