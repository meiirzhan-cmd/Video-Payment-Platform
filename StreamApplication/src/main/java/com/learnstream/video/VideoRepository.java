package com.learnstream.video;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface VideoRepository extends JpaRepository<Video, UUID> {

    Page<Video> findByCreatorId(UUID creatorId, Pageable pageable);

    Page<Video> findByStatus(VideoStatus status, Pageable pageable);

    @Query("SELECT v FROM Video v WHERE v.status = 'READY' " +
           "AND (LOWER(v.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(v.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Video> searchReadyVideos(@Param("search") String search, Pageable pageable);

    Page<Video> findByStatusOrderByCreatedAtDesc(VideoStatus status, Pageable pageable);

    long countByCreatorId(UUID creatorId);
}
