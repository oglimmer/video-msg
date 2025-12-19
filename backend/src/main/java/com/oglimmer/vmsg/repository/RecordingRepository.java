/* Copyright (c) 2025 by oglimmer.com / Oliver Zimpasser. All rights reserved. */
package com.oglimmer.vmsg.repository;

import com.oglimmer.vmsg.entity.Recording;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, Long> {
  Optional<Recording> findByUuid(String uuid);
}
