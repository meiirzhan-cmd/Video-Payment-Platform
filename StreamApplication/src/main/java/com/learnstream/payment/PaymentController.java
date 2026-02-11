package com.learnstream.payment;

import com.learnstream.auth.CurrentUser;
import com.learnstream.payment.dto.CheckoutResponse;
import com.learnstream.payment.dto.CreateCheckoutRequest;
import com.learnstream.payment.dto.CreatorStatsResponse;
import com.learnstream.payment.dto.PurchaseResponse;
import com.learnstream.payment.dto.VideoAccessResponse;
import com.learnstream.video.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/payments/checkout")
    public ResponseEntity<CheckoutResponse> createCheckout(
            @Valid @RequestBody CreateCheckoutRequest request,
            @CurrentUser UUID buyerId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createCheckoutSession(request, buyerId));
    }

    @PostMapping("/webhooks/stripe")
    public ResponseEntity<Void> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.handleWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/purchases")
    public ResponseEntity<PageResponse<PurchaseResponse>> listPurchases(
            @CurrentUser UUID buyerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(paymentService.listUserPurchases(buyerId, pageable));
    }

    @GetMapping("/creator/stats")
    public ResponseEntity<CreatorStatsResponse> getCreatorStats(
            @CurrentUser UUID creatorId) {
        return ResponseEntity.ok(paymentService.getCreatorStats(creatorId));
    }

    @GetMapping("/videos/{id}/access")
    public ResponseEntity<VideoAccessResponse> checkAccess(
            @PathVariable UUID id,
            @CurrentUser UUID userId) {
        return ResponseEntity.ok(paymentService.checkAccess(userId, id));
    }
}
