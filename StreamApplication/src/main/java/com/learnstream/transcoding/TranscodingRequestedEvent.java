package com.learnstream.transcoding;

import java.util.UUID;

public record TranscodingRequestedEvent(
        UUID jobId,
        UUID videoId
) {}
