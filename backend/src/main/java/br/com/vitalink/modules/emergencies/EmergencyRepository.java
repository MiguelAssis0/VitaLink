package br.com.vitalink.modules.emergencies;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
public interface EmergencyRepository extends JpaRepository<Emergency, UUID> {
    List<Emergency> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    Page<Emergency> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);
    Page<Emergency> findByCentralIdAndStatusOrderByCreatedAtDesc(UUID centralId, EmergencyStatus status, Pageable pageable);
    Page<Emergency> findByCentralIdOrderByCreatedAtDesc(UUID centralId, Pageable pageable);
    Page<Emergency> findByHospitalIdOrderByCreatedAtDesc(UUID hospitalId, Pageable pageable);
    boolean existsByPatientIdAndStatusIn(UUID patientId, java.util.Collection<EmergencyStatus> statuses);
    long countByStatusIn(java.util.Collection<EmergencyStatus> statuses);
}
