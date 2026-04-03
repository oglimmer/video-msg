# Build stage with GraalVM for native image compilation
FROM ghcr.io/graalvm/native-image-community:21 AS build

# Install Maven (copy from official Maven image)
COPY --from=maven:3.9 /usr/share/maven /usr/share/maven
ENV PATH="/usr/share/maven/bin:${PATH}"

WORKDIR /app

# Copy pom.xml and download dependencies (for caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build native image using Spring Boot's native profile
RUN mvn -Pnative native:compile -DskipTests

# Runtime stage - minimal image (glibc-based to match build environment)
FROM debian:bookworm-slim

WORKDIR /app

# Install ffmpeg for video re-encoding and wget for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg wget && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --gid 10001 appgroup && \
    adduser --uid 10001 --ingroup appgroup --disabled-password --gecos "" appuser

# Create video storage directory
RUN mkdir -p /app/video-storage && \
    chown -R appuser:appgroup /app

# Copy native binary from build stage
COPY --from=build /app/target/vmsg /app/vmsg

# Switch to non-root user
USER appuser:appgroup

# Expose port
EXPOSE 8080

# Health check (reduced start-period since native image starts in milliseconds)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/actuator/health || exit 1

# Run the native application
ENTRYPOINT ["/app/vmsg"]
