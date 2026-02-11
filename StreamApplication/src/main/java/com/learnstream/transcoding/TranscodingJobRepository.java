package com.learnstream.transcoding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface TranscodingJobRepository extends JpaRepository<TranscodingJob, UUID> {

    @Query("SELECT j FROM TranscodingJob j WHERE j.status = 'PENDING' ORDER BY j.createdAt ASC LIMIT 1")
    Optional<TranscodingJob> findNextPending();

    Optional<TranscodingJob> findByVideoId(UUID videoId);
}
