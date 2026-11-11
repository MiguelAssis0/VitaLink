package br.com.vitalink.modules.patients;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, UUID> {
    List<EmergencyContact> findByPatientIdOrderByNameAsc(UUID patientId);
    void deleteByPatientId(UUID patientId);
}
