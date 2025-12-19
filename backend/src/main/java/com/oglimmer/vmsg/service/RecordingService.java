/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.service;

import com.oglimmer.vmsg.dto.RecordingDetailResponse;
import com.oglimmer.vmsg.dto.RecordingResponse;
import com.oglimmer.vmsg.entity.ProcessingStatus;
import com.oglimmer.vmsg.entity.Recording;
import com.oglimmer.vmsg.exception.RecordingNotFoundException;
import com.oglimmer.vmsg.mapper.RecordingMapper;
import com.oglimmer.vmsg.repository.RecordingRepository;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecordingService {

  private final RecordingRepository recordingRepository;
  private final FileStorageService fileStorageService;
  private final RecordingMapper recordingMapper;
  private final VideoProcessingService videoProcessingService;

  @Transactional
  public RecordingResponse uploadRecording(MultipartFile file) throws IOException {
    // Generate UUID
    String uuid = UUID.randomUUID().toString();

    // Save file immediately
    String filePath = fileStorageService.saveFile(file, uuid);

    // Create and save entity with PROCESSING status
    Recording recording = new Recording();
    recording.setUuid(uuid);
    recording.setFilename(file.getOriginalFilename());
    recording.setFilePath(filePath);
    recording.setFileSize(file.getSize());
    recording.setContentType(file.getContentType());
    recording.setDuration(null);
    recording.setProcessingStatus(ProcessingStatus.PROCESSING);

    Recording savedRecording = recordingRepository.save(recording);

    log.info("Recording uploaded successfully with UUID: {}, starting async processing", uuid);

    // Start async re-encoding in background via separate service
    // Must use separate service to ensure Spring's @Async proxy works
    videoProcessingService.processVideoAsync(uuid);

    return recordingMapper.toResponse(savedRecording);
  }

  public RecordingDetailResponse getRecordingByUuid(String uuid) {
    Recording recording =
        recordingRepository
            .findByUuid(uuid)
            .orElseThrow(
                () -> new RecordingNotFoundException("Recording not found with UUID: " + uuid));

    return recordingMapper.toDetailResponse(recording);
  }

  public Resource streamRecording(String uuid) throws IOException {
    Recording recording =
        recordingRepository
            .findByUuid(uuid)
            .orElseThrow(
                () -> new RecordingNotFoundException("Recording not found with UUID: " + uuid));

    return fileStorageService.getFile(recording.getFilePath());
  }

  public Recording getRecordingEntityByUuid(String uuid) {
    return recordingRepository
        .findByUuid(uuid)
        .orElseThrow(
            () -> new RecordingNotFoundException("Recording not found with UUID: " + uuid));
  }
}
