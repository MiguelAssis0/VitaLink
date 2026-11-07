package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.AppUser;
import br.com.vitalink.modules.institutions.Institution;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="access_grants")
public class AccessGrant {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="emergency_id") public Emergency emergency;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="institution_id") public Institution institution;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="granted_by") public AppUser grantedBy;
    @Column(name="created_at") public Instant createdAt = Instant.now();
    @Column(name="expires_at") public Instant expiresAt;
    @Column(name="revoked_at") public Instant revokedAt;
    protected AccessGrant() {}
    public AccessGrant(Emergency emergency, Institution institution, AppUser grantedBy, Instant expiresAt) {
        this.id=UUID.randomUUID(); this.emergency=emergency; this.institution=institution; this.grantedBy=grantedBy; this.expiresAt=expiresAt;
    }
}
