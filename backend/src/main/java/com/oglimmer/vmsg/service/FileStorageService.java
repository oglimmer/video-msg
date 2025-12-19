/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.service;

import com.oglimmer.vmsg.config.FileStorageConfig;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

  private final FileStorageConfig fileStorageConfig;

  public String saveFile(MultipartFile file, String uuid) throws IOException {
    // Create directory structure: YYYY/MM/DD
    LocalDate now = LocalDate.now();
    String directoryPath =
        String.format("%04d/%02d/%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());

    Path targetDir = Paths.get(fileStorageConfig.getBaseDirectory(), directoryPath);
    Files.createDirectories(targetDir);

    // Get file extension from original filename or content type
    String extension = getFileExtension(file.getOriginalFilename());
    String filename = uuid + extension;

    // Save file
    Path targetPath = targetDir.resolve(filename);
    Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

    String relativePath = directoryPath + "/" + filename;
    log.info("Saved file to: {}", relativePath);

    return relativePath;
  }

  public Resource getFile(String filePath) throws IOException {
    Path path = Paths.get(fileStorageConfig.getBaseDirectory(), filePath);
    Resource resource = new UrlResource(path.toUri());

    if (resource.exists() && resource.isReadable()) {
      return resource;
    } else {
      throw new IOException("File not found or not readable: " + filePath);
    }
  }

  public long getFileSize(String filePath) throws IOException {
    Path path = Paths.get(fileStorageConfig.getBaseDirectory(), filePath);
    return Files.size(path);
  }

  public Path getAbsolutePath(String filePath) {
    return Paths.get(fileStorageConfig.getBaseDirectory(), filePath);
  }

  private String getFileExtension(String filename) {
    if (filename == null || filename.isEmpty()) {
      return ".webm"; // default extension
    }
    int lastDot = filename.lastIndexOf('.');
    if (lastDot > 0 && lastDot < filename.length() - 1) {
      return filename.substring(lastDot);
    }
    return ".webm"; // default extension
  }
}
