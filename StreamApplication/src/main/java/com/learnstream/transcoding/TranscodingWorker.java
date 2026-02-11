package com.learnstream.transcoding;

import com.learnstream.storage.StorageService;
import com.learnstream.video.Video;
import com.learnstream.video.VideoRepository;
import com.learnstream.video.VideoStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.UUID;
import java.util.stream.Stream;

@Component
public class TranscodingWorker {

    private static final Logger log = LoggerFactory.getLogger(TranscodingWorker.class);

    private final TranscodingService transcodingService;
    private final VideoRepository videoRepository;
    private final StorageService storageService;
    private final TranscodingConfig config;

    public TranscodingWorker(TranscodingService transcodingService,
                             VideoRepository videoRepository,
                             StorageService storageService,
                             TranscodingConfig config) {
        this.transcodingService = transcodingService;
        this.videoRepository = videoRepository;
        this.storageService = storageService;
        this.config = config;
    }

    @Scheduled(fixedDelayString = "${transcoding.poll-interval-ms:5000}")
    public void poll() {
        TranscodingJob job = transcodingService.claimNextJob();
        if (job == null) return;

        log.info("Processing transcoding job {} for video {}", job.getId(), job.getVideoId());

        try {
            processJob(job);
        } catch (Exception e) {
            log.error("Transcoding failed for job {}", job.getId(), e);
            transcodingService.markFailed(job.getId(), e.getMessage());
            updateVideoStatus(job.getVideoId(), VideoStatus.FAILED);
        }
    }

    private void processJob(TranscodingJob job) throws IOException, InterruptedException {
        Video video = videoRepository.findById(job.getVideoId())
                .orElseThrow(() -> new IllegalStateException("Video not found: " + job.getVideoId()));

        Path workDir = Path.of(config.tempDir(), job.getId().toString());
        Files.createDirectories(workDir);

        try {
            // Step 1: Download raw video from MinIO
            Path rawFile = workDir.resolve("input" + getExtension(video.getRawStorageKey()));
            downloadFromStorage(video.getRawStorageKey(), rawFile);

            // Step 2: Extract duration via ffprobe
            int durationSecs = probeDuration(rawFile);

            // Step 3: Extract thumbnail
            Path thumbnailFile = workDir.resolve("thumbnail.jpg");
            extractThumbnail(rawFile, thumbnailFile);

            // Step 4: Transcode to multi-quality HLS
            Path hlsDir = workDir.resolve("hls");
            Files.createDirectories(hlsDir);
            transcodeToHls(rawFile, hlsDir);

            // Step 5: Upload HLS output to processed bucket
            String hlsPrefix = video.getCreatorId() + "/" + video.getId() + "/hls/";
            uploadDirectory(hlsDir, storageService.processedBucket(), hlsPrefix);

            // Step 6: Upload thumbnail
            String thumbnailKey = video.getCreatorId() + "/" + video.getId() + "/thumbnail.jpg";
            storageService.uploadFile(
                    storageService.processedBucket(), thumbnailKey, thumbnailFile, "image/jpeg");

            // Step 7: Update video record
            video.setHlsStorageKey(hlsPrefix + "master.m3u8");
            video.setThumbnailUrl(thumbnailKey);
            video.setDurationSecs(durationSecs);
            video.setStatus(VideoStatus.READY);
            videoRepository.save(video);

            transcodingService.markCompleted(job.getId());
            log.info("Transcoding completed for video {}", video.getId());

        } finally {
            deleteDirectory(workDir);
        }
    }

    private void downloadFromStorage(String key, Path destination) throws IOException {
        try (InputStream is = storageService.download(storageService.rawBucket(), key)) {
            Files.copy(is, destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private int probeDuration(Path inputFile) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                config.ffprobePath(),
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                inputFile.toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String output = new String(process.getInputStream().readAllBytes()).trim();
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("ffprobe failed with exit code " + exitCode);
        }
        return (int) Math.round(Double.parseDouble(output));
    }

    private void extractThumbnail(Path inputFile, Path thumbnailFile)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                config.ffmpegPath(),
                "-i", inputFile.toString(),
                "-ss", "00:00:01",
                "-vframes", "1",
                "-vf", "scale=640:-1",
                "-y",
                thumbnailFile.toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        process.getInputStream().readAllBytes();
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            log.warn("Thumbnail extraction failed (exit {}), continuing without thumbnail", exitCode);
        }
    }

    private void transcodeToHls(Path inputFile, Path hlsDir) throws IOException, InterruptedException {
        var cmd = new ArrayList<String>();
        cmd.add(config.ffmpegPath());
        cmd.add("-i");
        cmd.add(inputFile.toString());

        var qualities = config.qualities();

        for (int i = 0; i < qualities.size(); i++) {
            var q = qualities.get(i);
            cmd.add("-map"); cmd.add("0:v:0");
            cmd.add("-map"); cmd.add("0:a:0?");
            cmd.add("-c:v:" + i); cmd.add("libx264");
            cmd.add("-b:v:" + i); cmd.add(q.bitrate());
            cmd.add("-s:v:" + i); cmd.add(q.width() + "x" + q.height());
            cmd.add("-c:a:" + i); cmd.add("aac");
            cmd.add("-b:a:" + i); cmd.add("128k");
        }

        cmd.add("-f"); cmd.add("hls");
        cmd.add("-hls_time"); cmd.add("6");
        cmd.add("-hls_list_size"); cmd.add("0");
        cmd.add("-hls_segment_filename");
        cmd.add(hlsDir.resolve("stream_%v_%03d.ts").toString());
        cmd.add("-master_pl_name"); cmd.add("master.m3u8");
        cmd.add("-var_stream_map");

        var streamMap = new StringBuilder();
        for (int i = 0; i < qualities.size(); i++) {
            if (i > 0) streamMap.append(" ");
            streamMap.append("v:").append(i).append(",a:").append(i)
                     .append(",name:").append(qualities.get(i).label());
        }
        cmd.add(streamMap.toString());
        cmd.add(hlsDir.resolve("stream_%v.m3u8").toString());
        cmd.add("-y");

        log.info("Running FFmpeg: {}", String.join(" ", cmd));

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        String output = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            log.error("FFmpeg output: {}", output);
            throw new IOException("FFmpeg transcoding failed with exit code " + exitCode);
        }
    }

    private void uploadDirectory(Path dir, String bucket, String prefix) throws IOException {
        try (Stream<Path> files = Files.walk(dir)) {
            files.filter(Files::isRegularFile).forEach(file -> {
                String key = prefix + dir.relativize(file).toString().replace('\\', '/');
                String contentType = guessContentType(file.getFileName().toString());
                storageService.uploadFile(bucket, key, file, contentType);
            });
        }
    }

    private String guessContentType(String filename) {
        if (filename.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
        if (filename.endsWith(".ts")) return "video/mp2t";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    private void updateVideoStatus(UUID videoId, VideoStatus status) {
        videoRepository.findById(videoId).ifPresent(video -> {
            video.setStatus(status);
            videoRepository.save(video);
        });
    }

    private void deleteDirectory(Path dir) {
        try (Stream<Path> files = Files.walk(dir)) {
            files.sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try { Files.deleteIfExists(path); } catch (IOException ignored) {}
                    });
        } catch (IOException ignored) {}
    }

    private String getExtension(String key) {
        if (key == null) return ".mp4";
        int dot = key.lastIndexOf('.');
        return dot >= 0 ? key.substring(dot) : ".mp4";
    }
}
