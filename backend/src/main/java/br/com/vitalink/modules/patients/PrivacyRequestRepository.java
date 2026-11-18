package br.com.vitalink.modules.patients;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrivacyRequestRepository extends JpaRepository<PrivacyRequest, UUID> {
    List<PrivacyRequest> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    boolean existsByPatientIdAndTypeAndStatus(UUID patientId, br.com.vitalink.shared.api.Api.PrivacyRequestType type,
            String status);

    long countByTypeAndStatus(br.com.vitalink.shared.api.Api.PrivacyRequestType type, String status);
}
