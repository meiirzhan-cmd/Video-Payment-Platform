package com.learnstream.video;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "videos")
@Getter
@Setter
@NoArgsConstructor
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID creatorId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "price_cents", nullable = false)
    private int priceCents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VideoStatus status = VideoStatus.DRAFT;

    @Column(name = "raw_storage_key")
    private String rawStorageKey;

    @Column(name = "hls_storage_key")
    private String hlsStorageKey;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "duration_secs")
    private Integer durationSecs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
