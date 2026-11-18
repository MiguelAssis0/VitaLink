package br.com.vitalink.modules.emergencies;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusEventRepository extends JpaRepository<StatusEvent, UUID> {
    List<StatusEvent> findByEmergencyIdOrderByCreatedAtAsc(UUID emergencyId);
}
