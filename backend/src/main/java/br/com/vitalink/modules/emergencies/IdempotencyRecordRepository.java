package br.com.vitalink.modules.emergencies;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, UUID> {
    Optional<IdempotencyRecord> findByUserIdAndKeyHash(UUID userId, String keyHash);
}
