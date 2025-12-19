/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.controller;

import com.oglimmer.vmsg.dto.RecordingDetailResponse;
import com.oglimmer.vmsg.dto.RecordingResponse;
import com.oglimmer.vmsg.entity.Recording;
import com.oglimmer.vmsg.exception.RecordingNotFoundException;
import com.oglimmer.vmsg.service.RecordingService;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/recordings")
@RequiredArgsConstructor
@Slf4j
public class RecordingController {

  private final RecordingService recordingService;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<RecordingResponse> uploadRecording(
      @RequestParam("video") MultipartFile file) {
    try {
      RecordingResponse response = recordingService.uploadRecording(file);
      return ResponseEntity.status(HttpStatus.CREATED).body(response);
    } catch (IOException e) {
      log.error("Error uploading recording", e);
      throw new RuntimeException("Failed to upload recording", e);
    }
  }

  @GetMapping("/{uuid}")
  public ResponseEntity<RecordingDetailResponse> getRecording(@PathVariable String uuid) {
    RecordingDetailResponse response = recordingService.getRecordingByUuid(uuid);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/{uuid}/stream")
  public ResponseEntity<?> streamRecording(
      @PathVariable String uuid,
      @RequestHeader(value = "Range", required = false) String rangeHeader) {

    log.info("Stream request received for UUID: {} with Range: {}", uuid, rangeHeader);

    try {
      // Get recording and validate it exists FIRST (before any response is committed)
      Recording recording = recordingService.getRecordingEntityByUuid(uuid);
      log.info("Found recording: {} with file path: {}", recording.getUuid(), recording.getFilePath());

      // Get the file resource and validate it exists/is readable
      Resource resource = recordingService.streamRecording(uuid);

      // Validate resource is readable
      if (!resource.exists()) {
        log.error("Resource does not exist for UUID: {}, path: {}", uuid, recording.getFilePath());
        throw new RecordingNotFoundException("Video file does not exist for recording: " + uuid);
      }
      if (!resource.isReadable()) {
        log.error("Resource is not readable for UUID: {}, path: {}", uuid, recording.getFilePath());
        throw new RecordingNotFoundException("Video file is not readable for recording: " + uuid);
      }

      long fileSize = resource.contentLength();
      log.info("Resource validated - size: {} bytes", fileSize);

      HttpHeaders headers = new HttpHeaders();

      // Parse content type safely - extract just the base type without codecs if parsing fails
      MediaType contentType;
      try {
        contentType = MediaType.parseMediaType(recording.getContentType());
      } catch (Exception e) {
        // If parsing fails (e.g., codecs parameter with comma), extract base type
        String baseType = recording.getContentType().split(";")[0].trim();
        contentType = MediaType.parseMediaType(baseType);
        log.warn(
            "Failed to parse full content type {}, using base type {}",
            recording.getContentType(),
            baseType);
      }
      headers.setContentType(contentType);

      // Always return full content for now
      // TODO: Implement proper Range request support with partial file reading
      headers.setContentLength(fileSize);

      log.info("Returning full content: {} bytes", fileSize);
      return ResponseEntity.ok().headers(headers).body(resource);

    } catch (RecordingNotFoundException e) {
      // Re-throw to let global exception handler deal with it
      // This happens before response is committed, so JSON error response will work
      log.error("Recording not found: {}", uuid, e);
      throw e;
    } catch (IOException e) {
      // Log the full error details
      log.error("IO error while preparing to stream recording {}: {}", uuid, e.getMessage(), e);
      // Re-throw as RecordingNotFoundException with more details
      throw new RecordingNotFoundException("Failed to access video file for recording: " + uuid + " - " + e.getMessage());
    } catch (Exception e) {
      // Log any unexpected errors
      log.error("Unexpected error streaming recording {}: {}", uuid, e.getMessage(), e);
      throw new RuntimeException("Failed to stream recording: " + e.getMessage(), e);
    }
  }
}
