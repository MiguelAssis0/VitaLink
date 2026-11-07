package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.AppUser;
import br.com.vitalink.modules.institutions.Institution;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="emergencies")
public class Emergency {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="patient_id") public AppUser patient;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="central_id") public Institution central;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="hospital_id") public Institution hospital;
    @Enumerated(EnumType.STRING) public EmergencyStatus status;
    @Column(name="is_simulation") public boolean simulation = true;
    @Column(name="location_source") public String locationSource;
    @Column(name="manual_address", length=300) public String address = "";
    @Column(name="reference_point", length=200) public String referencePoint = "";
    public Double latitude;
    public Double longitude;
    @Column(name="accuracy_meters") public Double accuracyMeters;
    @Column(length=500) public String notes = "";
    @Version public long version;
    @Column(name="created_at") public Instant createdAt = Instant.now();
    @Column(name="updated_at") public Instant updatedAt = Instant.now();
    @Column(name="closed_at") public Instant closedAt;
    protected Emergency() {}
}
