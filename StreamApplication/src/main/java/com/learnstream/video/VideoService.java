package com.learnstream.video;

import com.learnstream.storage.StorageService;
import com.learnstream.transcoding.TranscodingService;
import com.learnstream.video.dto.CreateVideoRequest;
import com.learnstream.video.dto.PageResponse;
import com.learnstream.video.dto.StreamResponse;
import com.learnstream.video.dto.UpdateVideoRequest;
import com.learnstream.video.dto.VideoResponse;
import com.learnstream.video.exception.InvalidThumbnailException;
import com.learnstream.video.exception.InvalidVideoFileException;
import com.learnstream.video.exception.VideoAccessDeniedException;
import com.learnstream.video.exception.VideoNotFoundException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
public class VideoService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "video/mp4", "video/quicktime", "video/webm"
    );
    private static final long MAX_FILE_SIZE = 2L * 1024 * 1024 * 1024; // 2 GB

    private static final Set<String> ALLOWED_THUMBNAIL_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_THUMBNAIL_SIZE = 5L * 1024 * 1024; // 5 MB

    private final VideoRepository videoRepository;
    private final StorageService storageService;
    private final TranscodingService transcodingService;

    public VideoService(VideoRepository videoRepository,
                        StorageService storageService,
                        TranscodingService transcodingService) {
        this.videoRepository = videoRepository;
        this.storageService = storageService;
        this.transcodingService = transcodingService;
    }

    @Transactional
    public VideoResponse create(CreateVideoRequest request, UUID creatorId) {
        var video = new Video();
        video.setCreatorId(creatorId);
        video.setTitle(request.title());
        video.setDescription(request.description());
        video.setPriceCents(request.priceCents());
        video.setStatus(VideoStatus.DRAFT);
        videoRepository.save(video);
        return toResponse(video);
    }

    @Transactional
    public VideoResponse upload(UUID videoId, MultipartFile file, UUID creatorId) throws IOException {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.getCreatorId().equals(creatorId)) {
            throw new VideoAccessDeniedException();
        }

        validateVideoFile(file);

        String key = creatorId + "/" + videoId + "/original" + getExtension(file.getOriginalFilename());
        storageService.upload(
                storageService.rawBucket(),
                key,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        video.setRawStorageKey(key);
        video.setStatus(VideoStatus.PROCESSING);
        videoRepository.save(video);

        transcodingService.createJob(video.getId());

        return toResponse(video);
    }

    @Transactional
    public VideoResponse uploadThumbnail(UUID videoId, MultipartFile file, UUID creatorId) throws IOException {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.getCreatorId().equals(creatorId)) {
            throw new VideoAccessDeniedException();
        }

        validateThumbnailFile(file);

        String extension = getImageExtension(file.getContentType());
        String key = creatorId + "/" + videoId + "/custom-thumbnail" + extension;

        storageService.upload(
                storageService.processedBucket(),
                key,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        // Delete old custom thumbnail if key changed
        if (video.getThumbnailUrl() != null
                && video.getThumbnailUrl().contains("custom-thumbnail")
                && !video.getThumbnailUrl().equals(key)) {
            storageService.delete(storageService.processedBucket(), video.getThumbnailUrl());
        }

        video.setThumbnailUrl(key);
        videoRepository.save(video);

        return toResponse(video);
    }

    @Transactional
    public VideoResponse deleteThumbnail(UUID videoId, UUID creatorId) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.getCreatorId().equals(creatorId)) {
            throw new VideoAccessDeniedException();
        }

        if (video.getThumbnailUrl() != null && video.getThumbnailUrl().contains("custom-thumbnail")) {
            storageService.delete(storageService.processedBucket(), video.getThumbnailUrl());
            // Restore auto-generated thumbnail key
            String autoKey = creatorId + "/" + videoId + "/thumbnail.jpg";
            video.setThumbnailUrl(autoKey);
            videoRepository.save(video);
        }

        return toResponse(video);
    }

    @Transactional(readOnly = true)
    public PageResponse<VideoResponse> listPublicVideos(String search, Pageable pageable) {
        var page = (search != null && !search.isBlank())
                ? videoRepository.searchReadyVideos(search.trim(), pageable)
                : videoRepository.findByStatus(VideoStatus.READY, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public VideoResponse getById(UUID videoId) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));
        return toResponse(video);
    }

    @Transactional
    public VideoResponse update(UUID videoId, UpdateVideoRequest request, UUID creatorId) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.getCreatorId().equals(creatorId)) {
            throw new VideoAccessDeniedException();
        }

        if (request.title() != null) {
            video.setTitle(request.title());
        }
        if (request.description() != null) {
            video.setDescription(request.description());
        }
        if (request.priceCents() != null) {
            video.setPriceCents(request.priceCents());
        }

        videoRepository.save(video);
        return toResponse(video);
    }

    @Transactional
    public void delete(UUID videoId, UUID creatorId) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.getCreatorId().equals(creatorId)) {
            throw new VideoAccessDeniedException();
        }

        if (video.getRawStorageKey() != null) {
            storageService.delete(storageService.rawBucket(), video.getRawStorageKey());
        }
        if (video.getHlsStorageKey() != null) {
            storageService.delete(storageService.processedBucket(), video.getHlsStorageKey());
        }
        // Clean up thumbnails
        if (video.getThumbnailUrl() != null) {
            storageService.delete(storageService.processedBucket(), video.getThumbnailUrl());
        }
        // Also try to clean up auto-generated thumbnail if a custom one was set
        String autoThumbnailKey = video.getCreatorId() + "/" + video.getId() + "/thumbnail.jpg";
        if (!autoThumbnailKey.equals(video.getThumbnailUrl())) {
            try {
                storageService.delete(storageService.processedBucket(), autoThumbnailKey);
            } catch (Exception ignored) {}
        }

        videoRepository.delete(video);
    }

    @Transactional(readOnly = true)
    public PageResponse<VideoResponse> listCreatorVideos(UUID creatorId, Pageable pageable) {
        var page = videoRepository.findByCreatorId(creatorId, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public StreamResponse getStreamUrl(UUID videoId) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (video.getStatus() != VideoStatus.READY || video.getHlsStorageKey() == null) {
            throw new VideoAccessDeniedException();
        }

        // Return backend proxy URL instead of presigned MinIO URL
        String proxyUrl = "/api/videos/" + videoId + "/hls/master.m3u8";
        return new StreamResponse(proxyUrl);
    }

    @Transactional(readOnly = true)
    public java.io.InputStream streamHlsContent(UUID videoId, String path) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (video.getStatus() != VideoStatus.READY || video.getHlsStorageKey() == null) {
            throw new VideoAccessDeniedException();
        }

        // hlsStorageKey = "{creatorId}/{videoId}/hls/master.m3u8"
        // Derive the base path: "{creatorId}/{videoId}/hls/"
        String hlsBase = video.getHlsStorageKey()
                .substring(0, video.getHlsStorageKey().lastIndexOf('/') + 1);
        String storageKey = hlsBase + path;

        return storageService.download(storageService.processedBucket(), storageKey);
    }

    private VideoResponse toResponse(Video video) {
        String presignedThumbnailUrl = null;
        if (video.getThumbnailUrl() != null) {
            presignedThumbnailUrl = storageService.generatePresignedUrl(
                    storageService.processedBucket(),
                    video.getThumbnailUrl(),
                    60
            ).toString();
        }
        return new VideoResponse(
                video.getId(),
                video.getCreatorId(),
                video.getTitle(),
                video.getDescription(),
                video.getPriceCents(),
                video.getStatus(),
                presignedThumbnailUrl,
                video.getDurationSecs(),
                video.getCreatedAt(),
                video.getUpdatedAt()
        );
    }

    private void validateVideoFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidVideoFileException("file is empty");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new InvalidVideoFileException("unsupported format — use mp4, mov, or webm");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidVideoFileException("file exceeds 2 GB limit");
        }
    }

    private void validateThumbnailFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidThumbnailException("file is empty");
        }
        if (!ALLOWED_THUMBNAIL_TYPES.contains(file.getContentType())) {
            throw new InvalidThumbnailException("unsupported format — use JPEG, PNG, or WebP");
        }
        if (file.getSize() > MAX_THUMBNAIL_SIZE) {
            throw new InvalidThumbnailException("file exceeds 5 MB limit");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".mp4";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".mp4";
    }

    private String getImageExtension(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
