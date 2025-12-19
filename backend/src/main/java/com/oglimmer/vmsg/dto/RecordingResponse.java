/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.dto;

import com.oglimmer.vmsg.entity.ProcessingStatus;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class RecordingResponse {
  private String uuid;
  private String filename;
  private Long fileSize;
  private String contentType;
  private ProcessingStatus processingStatus;
  private LocalDateTime createdAt;
}
