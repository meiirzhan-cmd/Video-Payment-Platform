package com.learnstream.payment.exception;

import java.util.UUID;

public class AlreadyPurchasedException extends RuntimeException {

    public AlreadyPurchasedException(UUID videoId) {
        super("Video already purchased: " + videoId);
    }
}
