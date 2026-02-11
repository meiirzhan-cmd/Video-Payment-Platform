package com.learnstream.payment.dto;

public record CheckoutResponse(
        String checkoutUrl,
        String sessionId
) {}
