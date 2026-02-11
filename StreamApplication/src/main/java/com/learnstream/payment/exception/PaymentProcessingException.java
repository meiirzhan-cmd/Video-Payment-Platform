package com.learnstream.payment.exception;

public class PaymentProcessingException extends RuntimeException {

    public PaymentProcessingException(String message) {
        super("Payment processing failed: " + message);
    }

    public PaymentProcessingException(String message, Throwable cause) {
        super("Payment processing failed: " + message, cause);
    }
}
