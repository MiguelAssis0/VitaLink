package br.com.vitalink.modules.auth;

import br.com.vitalink.modules.institutions.Institution;
import br.com.vitalink.shared.domain.Role;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="users")
public class AppUser {
    @Id public UUID id;
    public String email;
    @Column(name="password_hash") public String passwordHash;
    @Column(name="display_name") public String displayName;
    @Column(length=30) public String phone = "";
    @Enumerated(EnumType.STRING) public Role role;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="institution_id") public Institution institution;
    @Column(name="disabled_at") public Instant disabledAt;
    @Column(name="created_at") public Instant createdAt = Instant.now();
    protected AppUser() {}
    public UUID getId() { return id; }
    public String getDisplayName() { return displayName; }
    public Role getRole() { return role; }
}
