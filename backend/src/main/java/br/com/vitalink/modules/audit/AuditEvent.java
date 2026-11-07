package br.com.vitalink.modules.audit;

import br.com.vitalink.modules.auth.AppUser;
import br.com.vitalink.modules.institutions.Institution;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="audit_events")
public class AuditEvent {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="actor_id") public AppUser actor;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="institution_id") public Institution institution;
    public String action;
    @Column(name="object_type") public String objectType;
    @Column(name="object_id") public UUID objectId;
    public String result;
    @Column(name="occurred_at") public Instant occurredAt = Instant.now();
    @Column(name="correlation_id") public UUID correlationId;
    protected AuditEvent() {}
    public AuditEvent(AppUser actor, String action, String objectType, UUID objectId) {
        this.id=UUID.randomUUID(); this.actor=actor; this.institution=actor.institution; this.action=action;
        this.objectType=objectType; this.objectId=objectId; this.result="SUCCESS";
    }
}
