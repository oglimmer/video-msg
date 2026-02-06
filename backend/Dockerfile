# Multi-stage build for Spring Boot backend
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy pom.xml and download dependencies (for caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21.0.10_7-jre-alpine

WORKDIR /app

# Install ffmpeg for video re-encoding
RUN apk add --no-cache ffmpeg

# Create non-root user
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Create video storage directory
RUN mkdir -p /app/video-storage && \
    chown -R appuser:appgroup /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Switch to non-root user
USER appuser:appgroup

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
