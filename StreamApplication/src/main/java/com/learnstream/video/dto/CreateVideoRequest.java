package com.learnstream.video.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateVideoRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 5000) String description,
        @Min(0) int priceCents
) {}
