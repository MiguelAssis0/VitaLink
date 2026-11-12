package br.com.vitalink.modules.fleet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.UUID;

public interface AmbulanceRepository extends JpaRepository<Ambulance, UUID> {
    List<Ambulance> findByCentralIdOrderByCodeAsc(UUID centralId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Ambulance a where a.central.id=:centralId and a.status=:status and a.latitude is not null and a.longitude is not null order by a.code")
    List<Ambulance> lockAvailableWithLocation(@Param("centralId") UUID centralId, @Param("status") AmbulanceStatus status);
    boolean existsByCentralIdAndCodeIgnoreCase(UUID centralId, String code);
}
