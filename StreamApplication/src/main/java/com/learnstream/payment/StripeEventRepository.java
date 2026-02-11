package com.learnstream.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StripeEventRepository extends JpaRepository<StripeEvent, UUID> {

    boolean existsByStripeEventId(String stripeEventId);
}
