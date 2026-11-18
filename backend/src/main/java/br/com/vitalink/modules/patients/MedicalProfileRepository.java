package br.com.vitalink.modules.patients;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalProfileRepository extends JpaRepository<MedicalProfile, UUID> {
}
