package br.com.vitalink.modules.hospital;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.UUID;

public interface AmbulanceCrewRepository extends JpaRepository<AmbulanceCrewMember, UUID> {
    List<AmbulanceCrewMember> findByHospitalIdOrderByNameAsc(UUID hospitalId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from AmbulanceCrewMember c where c.hospital.id=:hospitalId and c.available=true order by c.name")
    List<AmbulanceCrewMember> lockAvailableByHospitalId(@Param("hospitalId") UUID hospitalId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from AmbulanceCrewMember c where c.id=:id and c.hospital.id=:hospitalId")
    java.util.Optional<AmbulanceCrewMember> lockByIdAndHospitalId(@Param("id") UUID id, @Param("hospitalId") UUID hospitalId);
}
