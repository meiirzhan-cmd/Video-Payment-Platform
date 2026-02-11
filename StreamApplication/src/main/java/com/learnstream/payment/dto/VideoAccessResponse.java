package com.learnstream.payment.dto;

public record VideoAccessResponse(
        boolean hasAccess,
        String reason
) {}
