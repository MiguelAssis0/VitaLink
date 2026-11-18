package br.com.vitalink.modules.institutions;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InstitutionRepository extends JpaRepository<Institution, UUID> {
    List<Institution> findByKindAndLatitudeIsNotNullAndLongitudeIsNotNull(String kind);

    List<Institution> findByKindAndAcceptingEmergenciesTrueAndLatitudeIsNotNullAndLongitudeIsNotNull(String kind);
}
