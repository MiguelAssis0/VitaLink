package br.com.vitalink.modules.patients;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface MedicalProfileRepository extends JpaRepository<MedicalProfile, UUID> { }
