package com.learnstream.transcoding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class TranscodingService {

    private static final Logger log = LoggerFactory.getLogger(TranscodingService.class);

    private final TranscodingJobRepository transcodingJobRepository;
    private final KafkaTemplate<String, TranscodingRequestedEvent> kafkaTemplate;
    private final TranscodingConfig config;

    public TranscodingService(TranscodingJobRepository transcodingJobRepository,
                              KafkaTemplate<String, TranscodingRequestedEvent> kafkaTemplate,
                              TranscodingConfig config) {
        this.transcodingJobRepository = transcodingJobRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.config = config;
    }

    @Transactional
    public TranscodingJob createJob(UUID videoId) {
        var job = new TranscodingJob();
        job.setVideoId(videoId);
        job.setStatus(TranscodingJobStatus.PENDING);
        transcodingJobRepository.save(job);
        log.info("Created transcoding job {} for video {}", job.getId(), videoId);

        var event = new TranscodingRequestedEvent(job.getId(), videoId);
        kafkaTemplate.send(config.topic(), videoId.toString(), event);
        log.info("Published transcoding event to topic '{}' for job {}", config.topic(), job.getId());

        return job;
    }

    @Transactional
    public void markInProgress(UUID jobId) {
        transcodingJobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(TranscodingJobStatus.IN_PROGRESS);
            job.setStartedAt(Instant.now());
            transcodingJobRepository.save(job);
        });
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
