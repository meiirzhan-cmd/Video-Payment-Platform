package com.learnstream.transcoding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class TranscodingService {

    private static final Logger log = LoggerFactory.getLogger(TranscodingService.class);

    private final TranscodingJobRepository transcodingJobRepository;

    public TranscodingService(TranscodingJobRepository transcodingJobRepository) {
        this.transcodingJobRepository = transcodingJobRepository;
    }

    @Transactional
    public TranscodingJob createJob(UUID videoId) {
        var job = new TranscodingJob();
        job.setVideoId(videoId);
        job.setStatus(TranscodingJobStatus.PENDING);
        transcodingJobRepository.save(job);
        log.info("Created transcoding job {} for video {}", job.getId(), videoId);
        return job;
    }

    @Transactional
    public TranscodingJob claimNextJob() {
        return transcodingJobRepository.findNextPending()
                .map(job -> {
                    job.setStatus(TranscodingJobStatus.IN_PROGRESS);
                    job.setStartedAt(Instant.now());
                    transcodingJobRepository.save(job);
                    return job;
                })
                .orElse(null);
    }

    @Transactional
    public void markCompleted(UUID jobId) {
        transcodingJobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(TranscodingJobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            transcodingJobRepository.save(job);
            log.info("Transcoding job {} completed", jobId);
        });
    }

    @Transactional
    public void markFailed(UUID jobId, String errorMessage) {
        transcodingJobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(TranscodingJobStatus.FAILED);
            job.setErrorMessage(errorMessage);
            job.setCompletedAt(Instant.now());
            transcodingJobRepository.save(job);
            log.error("Transcoding job {} failed: {}", jobId, errorMessage);
        });
    }
}
