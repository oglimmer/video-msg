/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.controller;

import com.oglimmer.vmsg.dto.RecordingDetailResponse;
import com.oglimmer.vmsg.dto.RecordingResponse;
import com.oglimmer.vmsg.entity.Recording;
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
  public ResponseEntity<Resource> streamRecording(
      @PathVariable String uuid,
      @RequestHeader(value = "Range", required = false) String rangeHeader) {
    try {
      Recording recording = recordingService.getRecordingEntityByUuid(uuid);
      Resource resource = recordingService.streamRecording(uuid);

      long fileSize = resource.contentLength();
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

      // Handle Range requests for video seeking
      if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
        String[] ranges = rangeHeader.substring(6).split("-");
        long start = Long.parseLong(ranges[0]);
        long end =
            ranges.length > 1 && !ranges[1].isEmpty() ? Long.parseLong(ranges[1]) : fileSize - 1;

        long contentLength = end - start + 1;

        headers.add("Content-Range", String.format("bytes %d-%d/%d", start, end, fileSize));
        headers.setContentLength(contentLength);
        headers.add("Accept-Ranges", "bytes");

        // Note: Full Range support with partial content would require
        // reading only the requested byte range from the file
        // For now, returning full content with 206 status
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).headers(headers).body(resource);
      }

      // Full content response
      headers.setContentLength(fileSize);
      headers.add("Accept-Ranges", "bytes");

      return ResponseEntity.ok().headers(headers).body(resource);

    } catch (IOException e) {
      log.error("Error streaming recording", e);
      throw new RuntimeException("Failed to stream recording", e);
    }
  }
}
