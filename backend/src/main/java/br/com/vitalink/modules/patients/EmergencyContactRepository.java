package br.com.vitalink.modules.patients;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, UUID> {
    List<EmergencyContact> findByPatientIdOrderByNameAsc(UUID patientId);

    List<EmergencyContact> findByPatientIdAndSmsOptInTrueOrderByNameAsc(UUID patientId);

    Optional<EmergencyContact> findByIdAndPatientId(UUID id, UUID patientId);

    void deleteByPatientId(UUID patientId);
}
