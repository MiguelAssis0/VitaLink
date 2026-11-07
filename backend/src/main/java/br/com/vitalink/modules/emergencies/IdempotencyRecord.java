package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.AppUser;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="idempotency_records")
public class IdempotencyRecord {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id") public AppUser user;
    @Column(name="key_hash", length=64) public String keyHash;
    @Column(name="request_hash", length=64) public String requestHash;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="emergency_id") public Emergency emergency;
    @Column(name="created_at") public Instant createdAt = Instant.now();
    protected IdempotencyRecord() {}
    public IdempotencyRecord(AppUser user, String keyHash, String requestHash, Emergency emergency) {
        this.id=UUID.randomUUID(); this.user=user; this.keyHash=keyHash; this.requestHash=requestHash; this.emergency=emergency;
    }
}
