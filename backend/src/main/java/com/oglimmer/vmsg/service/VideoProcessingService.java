/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.service;

import com.oglimmer.vmsg.entity.ProcessingStatus;
import com.oglimmer.vmsg.entity.Recording;
import com.oglimmer.vmsg.exception.RecordingNotFoundException;
import com.oglimmer.vmsg.repository.RecordingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Separate service for async video processing to ensure Spring's @Async proxy works correctly.
 * Calling @Async methods from the same class doesn't work due to Spring's proxy mechanism.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VideoProcessingService {

  private final RecordingRepository recordingRepository;
  private final VideoReencodingService videoReencodingService;
  private final FileStorageService fileStorageService;

  @Async
  @Transactional
  public void processVideoAsync(String uuid) {
    log.info("Starting async video processing for UUID: {}", uuid);

    try {
      Recording recording =
          recordingRepository
              .findByUuid(uuid)
              .orElseThrow(
                  () -> new RecordingNotFoundException("Recording not found with UUID: " + uuid));

      // Re-encode video to ensure proper spec compliance
      videoReencodingService.reencodeVideo(
          fileStorageService.getAbsolutePath(recording.getFilePath()));
      log.info("Video re-encoding completed for UUID: {}", uuid);

      // Get file size after re-encoding (may have changed)
      long fileSize = fileStorageService.getFileSize(recording.getFilePath());

      // Update recording with new file size and status
      recording.setFileSize(fileSize);
      recording.setContentType("video/webm"); // Always WebM after re-encoding
      recording.setProcessingStatus(ProcessingStatus.READY);
      recording.setProcessingError(null);

      recordingRepository.save(recording);

      log.info("Recording processing completed successfully for UUID: {}", uuid);

    } catch (Exception e) {
      log.error("Failed to process video for UUID: {}", uuid, e);

      // Update recording with error status
      try {
        Recording recording =
            recordingRepository
                .findByUuid(uuid)
                .orElseThrow(
                    () -> new RecordingNotFoundException("Recording not found with UUID: " + uuid));

        recording.setProcessingStatus(ProcessingStatus.FAILED);
        recording.setProcessingError(e.getMessage());
        recordingRepository.save(recording);
      } catch (Exception saveError) {
        log.error("Failed to save error status for UUID: {}", uuid, saveError);
      }
    }
  }
}
