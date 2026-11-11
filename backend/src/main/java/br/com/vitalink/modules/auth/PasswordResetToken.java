package br.com.vitalink.modules.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="password_reset_tokens")
public class PasswordResetToken {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id") public AppUser user;
    @Column(name="token_hash", nullable=false, length=64, unique=true) public String tokenHash;
    @Column(name="expires_at", nullable=false) public Instant expiresAt;
    @Column(name="used_at") public Instant usedAt;
    @Column(name="created_at", nullable=false) public Instant createdAt;

    protected PasswordResetToken() {}
    PasswordResetToken(AppUser user, String tokenHash, Instant expiresAt, Instant now) {
        this.id=UUID.randomUUID(); this.user=user; this.tokenHash=tokenHash; this.expiresAt=expiresAt; this.createdAt=now;
    }
}
