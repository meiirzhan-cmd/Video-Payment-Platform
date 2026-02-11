package com.learnstream.payment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {

    Optional<Purchase> findByBuyerIdAndVideoId(UUID buyerId, UUID videoId);

    boolean existsByBuyerIdAndVideoIdAndStatus(UUID buyerId, UUID videoId, PurchaseStatus status);

    @Query("SELECT p FROM Purchase p WHERE p.buyerId = :buyerId AND p.status = 'COMPLETED' ORDER BY p.createdAt DESC")
    Page<Purchase> findCompletedByBuyer(@Param("buyerId") UUID buyerId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Purchase p WHERE p.videoId IN " +
           "(SELECT v.id FROM Video v WHERE v.creatorId = :creatorId) AND p.status = 'COMPLETED'")
    long countCompletedByCreator(@Param("creatorId") UUID creatorId);

    @Query("SELECT COALESCE(SUM(p.amountCents), 0) FROM Purchase p WHERE p.videoId IN " +
           "(SELECT v.id FROM Video v WHERE v.creatorId = :creatorId) AND p.status = 'COMPLETED'")
    long sumEarningsByCreator(@Param("creatorId") UUID creatorId);
}
