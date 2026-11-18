package br.com.vitalink.modules.emergencies;

import java.time.Instant;
import java.util.UUID;

import br.com.vitalink.modules.auth.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "emergency_status_events")
public class StatusEvent {
    @Id
    public UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_id")
    public Emergency emergency;
    @Column(name = "old_status")
    public String oldStatus;
    @Column(name = "new_status")
    public String newStatus;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    public AppUser actor;
    @Column(name = "automatic", nullable = false)
    public boolean automatic;
    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    protected StatusEvent() {
    }

    public StatusEvent(Emergency emergency, String oldStatus, String newStatus, AppUser actor) {
        this.id = UUID.randomUUID();
        this.emergency = emergency;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.actor = actor;
    }

    public StatusEvent(Emergency emergency, String oldStatus, String newStatus, AppUser actor, boolean automatic) {
        this(emergency, oldStatus, newStatus, actor);
        this.automatic = automatic;
    }
}
