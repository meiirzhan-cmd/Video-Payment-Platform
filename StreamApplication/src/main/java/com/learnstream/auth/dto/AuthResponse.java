package com.learnstream.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken
) {}
