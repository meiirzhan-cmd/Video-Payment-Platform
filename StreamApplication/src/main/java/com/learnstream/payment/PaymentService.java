package com.learnstream.payment;

import com.learnstream.payment.dto.CheckoutResponse;
import com.learnstream.payment.dto.CreateCheckoutRequest;
import com.learnstream.payment.dto.CreatorStatsResponse;
import com.learnstream.payment.dto.PurchaseResponse;
import com.learnstream.payment.dto.VideoAccessResponse;
import com.learnstream.payment.exception.AlreadyPurchasedException;
import com.learnstream.payment.exception.PaymentProcessingException;
import com.learnstream.video.Video;
import com.learnstream.video.VideoRepository;
import com.learnstream.video.VideoStatus;
import com.learnstream.video.dto.PageResponse;
import com.learnstream.video.exception.VideoNotFoundException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PurchaseRepository purchaseRepository;
    private final StripeEventRepository stripeEventRepository;
    private final VideoRepository videoRepository;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    public PaymentService(PurchaseRepository purchaseRepository,
                          StripeEventRepository stripeEventRepository,
                          VideoRepository videoRepository) {
        this.purchaseRepository = purchaseRepository;
        this.stripeEventRepository = stripeEventRepository;
        this.videoRepository = videoRepository;
    }

    @Transactional
    public CheckoutResponse createCheckoutSession(CreateCheckoutRequest request, UUID buyerId) {
        Video video = videoRepository.findById(request.videoId())
                .orElseThrow(() -> new VideoNotFoundException(request.videoId()));

        if (video.getStatus() != VideoStatus.READY) {
            throw new PaymentProcessingException("video is not available for purchase");
        }

        if (video.getCreatorId().equals(buyerId)) {
            throw new PaymentProcessingException("creators cannot purchase their own videos");
        }

        if (purchaseRepository.existsByBuyerIdAndVideoIdAndStatus(
                buyerId, request.videoId(), PurchaseStatus.COMPLETED)) {
            throw new AlreadyPurchasedException(request.videoId());
        }

        // Free videos get immediate access
        if (video.getPriceCents() == 0) {
            var purchase = new Purchase();
            purchase.setBuyerId(buyerId);
            purchase.setVideoId(video.getId());
            purchase.setAmountCents(0);
            purchase.setStatus(PurchaseStatus.COMPLETED);
            purchaseRepository.save(purchase);
            return new CheckoutResponse(null, null);
        }

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:5173/purchase/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl("http://localhost:5173/purchase/cancel")
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("usd")
                                    .setUnitAmount((long) video.getPriceCents())
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(video.getTitle())
                                            .setDescription(video.getDescription() != null
                                                    ? video.getDescription() : "Video access")
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("buyer_id", buyerId.toString())
                    .putMetadata("video_id", video.getId().toString())
                    .build();

            Session session = Session.create(params);

            var purchase = new Purchase();
            purchase.setBuyerId(buyerId);
            purchase.setVideoId(video.getId());
            purchase.setAmountCents(video.getPriceCents());
            purchase.setStripePaymentId(session.getId());
            purchase.setStatus(PurchaseStatus.PENDING);
            purchaseRepository.save(purchase);

            return new CheckoutResponse(session.getUrl(), session.getId());
        } catch (StripeException e) {
            throw new PaymentProcessingException(e.getMessage(), e);
        }
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new PaymentProcessingException("invalid webhook signature");
        }

        // Idempotency check
        if (stripeEventRepository.existsByStripeEventId(event.getId())) {
            log.info("Duplicate Stripe event ignored: {}", event.getId());
            return;
        }

        var stripeEvent = new StripeEvent();
        stripeEvent.setStripeEventId(event.getId());
        stripeEvent.setEventType(event.getType());
        stripeEvent.setPayload(payload);
        stripeEvent.setProcessed(false);
        stripeEventRepository.save(stripeEvent);

        if ("checkout.session.completed".equals(event.getType())) {
            handleCheckoutCompleted(event);
        }

        stripeEvent.setProcessed(true);
        stripeEventRepository.save(stripeEvent);
    }

    @Transactional(readOnly = true)
    public boolean hasAccess(UUID userId, UUID videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (video.getCreatorId().equals(userId)) {
            return true;
        }

        if (video.getPriceCents() == 0 && video.getStatus() == VideoStatus.READY) {
            return true;
        }

        return purchaseRepository.existsByBuyerIdAndVideoIdAndStatus(
                userId, videoId, PurchaseStatus.COMPLETED);
    }

    @Transactional(readOnly = true)
    public VideoAccessResponse checkAccess(UUID userId, UUID videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (video.getCreatorId().equals(userId)) {
            return new VideoAccessResponse(true, "creator");
        }
        if (video.getPriceCents() == 0 && video.getStatus() == VideoStatus.READY) {
            return new VideoAccessResponse(true, "free");
        }
        if (purchaseRepository.existsByBuyerIdAndVideoIdAndStatus(
                userId, videoId, PurchaseStatus.COMPLETED)) {
            return new VideoAccessResponse(true, "purchased");
        }
        return new VideoAccessResponse(false, "not_purchased");
    }

    @Transactional(readOnly = true)
    public CreatorStatsResponse getCreatorStats(UUID creatorId) {
        long totalVideos = videoRepository.countByCreatorId(creatorId);
        long totalPurchases = purchaseRepository.countCompletedByCreator(creatorId);
        long totalEarnings = purchaseRepository.sumEarningsByCreator(creatorId);
        return new CreatorStatsResponse(totalVideos, totalPurchases, totalEarnings);
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> listUserPurchases(UUID buyerId, Pageable pageable) {
        var page = purchaseRepository.findCompletedByBuyer(buyerId, pageable);
        return PageResponse.from(page, PurchaseResponse::from);
    }

    private void handleCheckoutCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject().orElseThrow(() ->
                        new PaymentProcessingException("unable to deserialize checkout session"));

        String buyerIdStr = session.getMetadata().get("buyer_id");
        String videoIdStr = session.getMetadata().get("video_id");

        if (buyerIdStr == null || videoIdStr == null) {
            log.warn("Checkout session missing metadata: {}", session.getId());
            return;
        }

        UUID buyerId = UUID.fromString(buyerIdStr);
        UUID videoId = UUID.fromString(videoIdStr);

        purchaseRepository.findByBuyerIdAndVideoId(buyerId, videoId)
                .ifPresent(purchase -> {
                    purchase.setStatus(PurchaseStatus.COMPLETED);
                    purchase.setStripePaymentId(session.getPaymentIntent());
                    purchaseRepository.save(purchase);
                    log.info("Purchase completed: buyer={}, video={}", buyerId, videoId);
                });
    }
}
