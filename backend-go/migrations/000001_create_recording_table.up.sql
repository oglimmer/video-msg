CREATE TABLE IF NOT EXISTS recording (
    id BIGINT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    content_type VARCHAR(100),
    duration BIGINT,
    processing_status VARCHAR(255),
    processing_error VARCHAR(500),
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_recording_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
