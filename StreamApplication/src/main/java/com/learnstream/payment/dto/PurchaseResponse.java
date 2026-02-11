package com.learnstream.payment.dto;

import com.learnstream.payment.Purchase;
import com.learnstream.payment.PurchaseStatus;

import java.time.Instant;
import java.util.UUID;

public record PurchaseResponse(
        UUID id,
        UUID videoId,
        int amountCents,
        PurchaseStatus status,
        Instant createdAt
) {
    public static PurchaseResponse from(Purchase purchase) {
        return new PurchaseResponse(
                purchase.getId(),
                purchase.getVideoId(),
                purchase.getAmountCents(),
                purchase.getStatus(),
                purchase.getCreatedAt()
        );
    }
}
