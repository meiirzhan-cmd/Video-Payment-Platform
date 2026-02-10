package com.learnstream.video.dto;

import com.learnstream.video.Video;
import com.learnstream.video.VideoStatus;

import java.time.Instant;
import java.util.UUID;

public record VideoResponse(
        UUID id,
        UUID creatorId,
        String title,
        String description,
        int priceCents,
        VideoStatus status,
        String thumbnailUrl,
        Integer durationSecs,
        Instant createdAt,
        Instant updatedAt
) {
    public static VideoResponse from(Video video) {
        return new VideoResponse(
                video.getId(),
                video.getCreatorId(),
                video.getTitle(),
                video.getDescription(),
                video.getPriceCents(),
                video.getStatus(),
                video.getThumbnailUrl(),
                video.getDurationSecs(),
                video.getCreatedAt(),
                video.getUpdatedAt()
        );
    }
}
