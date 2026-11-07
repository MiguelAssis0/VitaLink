package br.com.vitalink.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;
import java.util.UUID;
public interface UserRepository extends JpaRepository<AppUser, UUID> {
    @EntityGraph(attributePaths="institution") Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
