package br.com.vitalink.modules.hospital;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface HospitalPatientRepository extends JpaRepository<HospitalPatient, UUID> {
    List<HospitalPatient> findByHospitalIdOrderByCreatedAtDesc(UUID hospitalId);
}
