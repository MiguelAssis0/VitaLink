package br.com.vitalink.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;
public interface UserRepository extends JpaRepository<AppUser, UUID> {
    @EntityGraph(attributePaths="institution") Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    @Modifying
    @Query("update AppUser u set u.passwordHash=:passwordHash where u.id=:userId")
    int updatePasswordHash(@Param("userId") UUID userId, @Param("passwordHash") String passwordHash);
}
