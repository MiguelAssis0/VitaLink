package br.com.vitalink.modules.fleet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AmbulanceRepository extends JpaRepository<Ambulance, UUID> {
    List<Ambulance> findByCentralIdOrderByCodeAsc(UUID centralId);
    boolean existsByCentralIdAndCodeIgnoreCase(UUID centralId, String code);
}
