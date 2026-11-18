package br.com.vitalink.modules.hospital;

import java.time.Instant;
import java.util.UUID;

import br.com.vitalink.modules.institutions.Institution;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "hospital_ambulance_crew")
public class AmbulanceCrewMember {
    @Id
    public UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    public Institution hospital;
    @Column(nullable = false, length = 120)
    public String name;
    @Column(nullable = false, length = 80)
    public String position;
    @Column(nullable = false, length = 30)
    public String phone = "";
    @Column(nullable = false)
    public boolean available = true;
    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    protected AmbulanceCrewMember() {
    }

    public AmbulanceCrewMember(Institution hospital, String name, String position, String phone) {
        this.id = UUID.randomUUID();
        this.hospital = hospital;
        this.name = name;
        this.position = position;
        this.phone = phone;
    }
}
