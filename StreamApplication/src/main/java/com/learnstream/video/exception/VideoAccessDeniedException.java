package com.learnstream.video.exception;

public class VideoAccessDeniedException extends RuntimeException {

    public VideoAccessDeniedException() {
        super("You do not have permission to modify this video");
    }
}
