/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.entity;

public enum ProcessingStatus {
  PROCESSING, // Video is being re-encoded
  READY, // Video is ready to stream
  FAILED // Re-encoding failed
}
