package br.com.vitalink.modules.hospital;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalPatientRepository extends JpaRepository<HospitalPatient, UUID> {
    List<HospitalPatient> findByHospitalIdOrderByCreatedAtDesc(UUID hospitalId);
}
