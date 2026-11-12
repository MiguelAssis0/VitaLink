package br.com.vitalink.modules.fleet;

import br.com.vitalink.modules.institutions.Institution;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="ambulances")
public class Ambulance {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="central_id", nullable=false) public Institution central;
    @Column(nullable=false, length=24) public String code;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=24) public AmbulanceStatus status;
    public Double latitude;
    public Double longitude;
    @Column(name="created_at", nullable=false) public Instant createdAt=Instant.now();
    protected Ambulance() {}
    public Ambulance(Institution central, String code, AmbulanceStatus status) {
        this.id=UUID.randomUUID(); this.central=central; this.code=code; this.status=status;
    }
}
