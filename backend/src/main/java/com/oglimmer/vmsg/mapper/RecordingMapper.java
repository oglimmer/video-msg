/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.mapper;

import com.oglimmer.vmsg.dto.RecordingDetailResponse;
import com.oglimmer.vmsg.dto.RecordingResponse;
import com.oglimmer.vmsg.entity.Recording;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RecordingMapper {
  RecordingResponse toResponse(Recording entity);

  RecordingDetailResponse toDetailResponse(Recording entity);
}
