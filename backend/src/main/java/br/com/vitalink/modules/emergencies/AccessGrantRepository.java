package br.com.vitalink.modules.emergencies;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
public interface AccessGrantRepository extends JpaRepository<AccessGrant, UUID> {
    java.util.List<AccessGrant> findByEmergencyIdAndRevokedAtIsNull(UUID emergencyId);
    @Query("select g from AccessGrant g where g.emergency.id=:emergencyId and g.institution.id=:institutionId and g.revokedAt is null and (g.expiresAt is null or g.expiresAt>:now)")
    Optional<AccessGrant> active(@Param("emergencyId") UUID emergencyId, @Param("institutionId") UUID institutionId, @Param("now") Instant now);
    @Query("select (count(g)>0) from AccessGrant g where g.emergency.id=:emergencyId and g.institution.id=:institutionId and g.revokedAt is null and (g.expiresAt is null or g.expiresAt>:now)")
    boolean existsActive(@Param("emergencyId") UUID emergencyId, @Param("institutionId") UUID institutionId, @Param("now") Instant now);
}
