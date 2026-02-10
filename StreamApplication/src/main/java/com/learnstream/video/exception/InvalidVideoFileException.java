package com.learnstream.video.exception;

public class InvalidVideoFileException extends RuntimeException {

    public InvalidVideoFileException(String reason) {
        super("Invalid video file: " + reason);
    }
}
