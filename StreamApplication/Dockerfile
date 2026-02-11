# Stage 1: Build with Gradle
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy Gradle wrapper and config first (dependency caching)
COPY gradle/wrapper/gradle-wrapper.jar  gradle/wrapper/
COPY gradle/wrapper/gradle-wrapper.properties gradle/wrapper/
COPY gradlew .
COPY build.gradle .
COPY settings.gradle .

# Download dependencies (cached layer)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# Copy source code
COPY src/ src/

# Build the application (skip tests)
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Runtime with JRE only
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Install FFmpeg for transcoding
RUN apk add --no-cache ffmpeg

# Create temp directory for transcoding
RUN mkdir -p /tmp/transcoding && chown appuser:appgroup /tmp/transcoding

COPY --from=builder /app/build/libs/*.jar app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
