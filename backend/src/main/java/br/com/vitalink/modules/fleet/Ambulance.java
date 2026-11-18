package br.com.vitalink.modules.fleet;

import java.time.Instant;
import java.util.UUID;

import br.com.vitalink.modules.institutions.Institution;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "ambulances")
public class Ambulance {
    @Id
    public UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "central_id", nullable = false)
    public Institution central;
    @Column(nullable = false, length = 24)
    public String code;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    public AmbulanceStatus status;
    public Double latitude;
    public Double longitude;
    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    protected Ambulance() {
    }

    public Ambulance(Institution central, String code, AmbulanceStatus status) {
        this.id = UUID.randomUUID();
        this.central = central;
        this.code = code;
        this.status = status;
    }
}
