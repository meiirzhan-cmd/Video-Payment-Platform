package com.learnstream.payment.dto;

public record CreatorStatsResponse(
        long totalVideos,
        long totalPurchases,
        long totalEarningsCents
) {}
