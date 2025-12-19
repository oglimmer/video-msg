/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for re-encoding video files using ffmpeg to ensure spec compliance. Browser-recorded
 * video may not be 100% according to spec, so we re-encode using VP9 codec with proper settings for
 * WebM format.
 */
@Service
@Slf4j
public class VideoReencodingService {

  /**
   * Re-encode a WebM video file using ffmpeg with VP9 video codec and Opus audio codec. The
   * original file is replaced with the re-encoded version.
   *
   * @param videoPath Path to the video file to re-encode
   * @throws IOException if re-encoding fails
   */
  public void reencodeVideo(Path videoPath) throws IOException {
    if (!Files.exists(videoPath)) {
      throw new IOException("Video file does not exist: " + videoPath);
    }

    // Create temporary file for re-encoded output
    String filename = videoPath.getFileName().toString();
    String tempFilename;
    int lastDot = filename.lastIndexOf('.');
    if (lastDot > 0) {
      tempFilename = filename.substring(0, lastDot) + "_tmp" + filename.substring(lastDot);
    } else {
      tempFilename = filename + "_tmp";
    }
    Path tempPath = videoPath.resolveSibling(tempFilename);

    try {
      // Build ffmpeg command for video re-encoding
      List<String> command = new ArrayList<>();
      command.add("ffmpeg");
      command.add("-y"); // Overwrite output file
      command.add("-fflags");
      command.add("+genpts"); // Generate presentation timestamps
      command.add("-i");
      command.add(videoPath.toAbsolutePath().toString()); // Input file

      // Video codec settings - VP9 for WebM
      command.add("-c:v");
      command.add("libvpx-vp9"); // VP9 codec
      command.add("-b:v");
      command.add("1M"); // Video bitrate - 1Mbps
      command.add("-crf");
      command.add("31"); // Constant Rate Factor (0-63, lower = better quality)
      command.add("-maxrate");
      command.add("1.5M"); // Maximum bitrate
      command.add("-bufsize");
      command.add("2M"); // Buffer size

      // Audio codec settings - Opus for WebM
      command.add("-c:a");
      command.add("libopus"); // Opus codec
      command.add("-b:a");
      command.add("128k"); // Audio bitrate
      command.add("-vbr");
      command.add("on"); // Variable bitrate for audio

      // Format and timestamp settings
      command.add("-f");
      command.add("webm"); // WebM format
      command.add("-avoid_negative_ts");
      command.add("make_zero"); // Avoid negative timestamps

      command.add(tempPath.toAbsolutePath().toString()); // Output file

      log.info("Re-encoding video file: {}", videoPath.getFileName());
      log.debug("ffmpeg command: {}", String.join(" ", command));

      // Execute ffmpeg command
      ProcessBuilder processBuilder = new ProcessBuilder(command);
      processBuilder.redirectErrorStream(true);
      Process process = processBuilder.start();

      // Capture output for debugging
      StringBuilder output = new StringBuilder();
      try (BufferedReader reader =
          new BufferedReader(new InputStreamReader(process.getInputStream()))) {
        String line;
        while ((line = reader.readLine()) != null) {
          output.append(line).append("\n");
        }
      }

      int exitCode = process.waitFor();

      if (exitCode == 0) {
        // Re-encoding successful, replace original file
        Files.delete(videoPath);
        Files.move(tempPath, videoPath);
        log.info("Successfully re-encoded video file: {}", videoPath.getFileName());
      } else {
        // Re-encoding failed, log error and clean up temp file
        log.error("ffmpeg re-encoding failed with exit code {}: {}", exitCode, output);
        Files.deleteIfExists(tempPath);
        throw new IOException("ffmpeg re-encoding failed with exit code " + exitCode);
      }

    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      Files.deleteIfExists(tempPath);
      throw new IOException("Video re-encoding was interrupted", e);
    } catch (IOException e) {
      // Clean up temp file on any IO error
      Files.deleteIfExists(tempPath);
      throw e;
    }
  }
}
