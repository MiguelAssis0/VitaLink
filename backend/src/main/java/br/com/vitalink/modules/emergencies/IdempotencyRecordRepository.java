package br.com.vitalink.modules.emergencies;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, UUID> {
    Optional<IdempotencyRecord> findByUserIdAndKeyHash(UUID userId, String keyHash);
}
