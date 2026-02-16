package com.learnstream.video.exception;

public class InvalidThumbnailException extends RuntimeException {

    public InvalidThumbnailException(String reason) {
        super("Invalid thumbnail: " + reason);
    }
}
