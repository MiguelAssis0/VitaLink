package br.com.vitalink.modules.hospital;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AmbulanceCrewRepository extends JpaRepository<AmbulanceCrewMember, UUID> {
    List<AmbulanceCrewMember> findByHospitalIdOrderByNameAsc(UUID hospitalId);
}
