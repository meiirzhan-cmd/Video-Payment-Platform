package com.learnstream.video;

import com.learnstream.storage.StorageService;
import com.learnstream.video.dto.CreateVideoRequest;
import com.learnstream.video.dto.PageResponse;
import com.learnstream.video.dto.UpdateVideoRequest;
import com.learnstream.video.dto.VideoResponse;
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

    private final VideoRepository videoRepository;
    private final StorageService storageService;

    public VideoService(VideoRepository videoRepository, StorageService storageService) {
        this.videoRepository = videoRepository;
        this.storageService = storageService;
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
        return VideoResponse.from(video);
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

        // TODO: dispatch transcoding job (Phase 4)

        return VideoResponse.from(video);
    }

    @Transactional(readOnly = true)
    public PageResponse<VideoResponse> listPublicVideos(String search, Pageable pageable) {
        var page = (search != null && !search.isBlank())
                ? videoRepository.searchReadyVideos(search.trim(), pageable)
                : videoRepository.findByStatus(VideoStatus.READY, pageable);
        return PageResponse.from(page, VideoResponse::from);
    }

    @Transactional(readOnly = true)
    public VideoResponse getById(UUID videoId) {
        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));
        return VideoResponse.from(video);
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
        return VideoResponse.from(video);
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

        videoRepository.delete(video);
    }

    @Transactional(readOnly = true)
    public PageResponse<VideoResponse> listCreatorVideos(UUID creatorId, Pageable pageable) {
        var page = videoRepository.findByCreatorId(creatorId, pageable);
        return PageResponse.from(page, VideoResponse::from);
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

    private String getExtension(String filename) {
        if (filename == null) return ".mp4";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".mp4";
    }
}
