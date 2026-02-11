package com.learnstream.transcoding;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "transcoding")
public record TranscodingConfig(
        String ffmpegPath,
        String ffprobePath,
        String tempDir,
        long pollIntervalMs,
        List<QualityPreset> qualities
) {
    public record QualityPreset(
            String label,
            int width,
            int height,
            String bitrate
    ) {}
}
