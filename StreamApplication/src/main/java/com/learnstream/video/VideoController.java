package com.learnstream.video;

import com.learnstream.auth.CurrentUser;
import com.learnstream.payment.PaymentService;
import com.learnstream.video.dto.CreateVideoRequest;
import com.learnstream.video.dto.PageResponse;
import com.learnstream.video.dto.StreamResponse;
import com.learnstream.video.dto.UpdateVideoRequest;
import com.learnstream.video.dto.VideoResponse;
import com.learnstream.video.exception.VideoAccessDeniedException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VideoController {

    private final VideoService videoService;
    private final PaymentService paymentService;

    public VideoController(VideoService videoService, PaymentService paymentService) {
        this.videoService = videoService;
        this.paymentService = paymentService;
    }

    // ── Public endpoints ──────────────────────────────────────

    @GetMapping("/videos")
    public ResponseEntity<PageResponse<VideoResponse>> listVideos(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(videoService.listPublicVideos(search, pageable));
    }

    @GetMapping("/videos/{id}")
    public ResponseEntity<VideoResponse> getVideo(@PathVariable UUID id) {
        return ResponseEntity.ok(videoService.getById(id));
    }

    // ── Creator endpoints (authenticated) ─────────────────────

    @PostMapping("/videos")
    public ResponseEntity<VideoResponse> createVideo(
            @Valid @RequestBody CreateVideoRequest request,
            @CurrentUser UUID creatorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(videoService.create(request, creatorId));
    }

    @PutMapping(value = "/videos/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoResponse> uploadVideo(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @CurrentUser UUID creatorId) throws IOException {
        return ResponseEntity.ok(videoService.upload(id, file, creatorId));
    }

    @PutMapping("/videos/{id}")
    public ResponseEntity<VideoResponse> updateVideo(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVideoRequest request,
            @CurrentUser UUID creatorId) {
        return ResponseEntity.ok(videoService.update(id, request, creatorId));
    }

    @DeleteMapping("/videos/{id}")
    public ResponseEntity<Void> deleteVideo(
            @PathVariable UUID id,
            @CurrentUser UUID creatorId) {
        videoService.delete(id, creatorId);
        return ResponseEntity.noContent().build();
    }

    // ── Streaming endpoint (authenticated + authorized) ──────

    @GetMapping("/videos/{id}/stream")
    public ResponseEntity<StreamResponse> streamVideo(
            @PathVariable UUID id,
            @CurrentUser UUID userId) {
        if (!paymentService.hasAccess(userId, id)) {
            throw new VideoAccessDeniedException();
        }
        return ResponseEntity.ok(videoService.getStreamUrl(id));
    }

    @GetMapping("/creator/videos")
    public ResponseEntity<PageResponse<VideoResponse>> listCreatorVideos(
            @CurrentUser UUID creatorId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(videoService.listCreatorVideos(creatorId, pageable));
    }
}
