/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "recordings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Recording {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false, length = 36)
  private String uuid;

  @Column(nullable = false)
  private String filename;

  @Column(nullable = false, length = 500)
  private String filePath;

  @Column(nullable = false)
  private Long fileSize;

  @Column(nullable = false, length = 100)
  private String contentType;

  @Column private Long duration;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ProcessingStatus processingStatus = ProcessingStatus.PROCESSING;

  @Column(length = 500)
  private String processingError;

  @CreationTimestamp
  @Column(updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp private LocalDateTime updatedAt;
}
