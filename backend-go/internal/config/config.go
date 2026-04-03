// Migrated from: application.yaml, FileStorageConfig.java
package config

import "os"

type Config struct {
	ServerPort           string
	DatabaseDSN          string
	FileStorageBaseDir   string
	CORSAllowedOrigin    string
}

func Load() *Config {
	return &Config{
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		DatabaseDSN:        getEnv("DATABASE_DSN", "video-message:video-message@tcp(localhost:3306)/video-message?parseTime=true"),
		FileStorageBaseDir: getEnv("FILE_STORAGE_BASE_DIRECTORY", "./video-storage"),
		CORSAllowedOrigin:  getEnv("CORS_ALLOWED_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}
