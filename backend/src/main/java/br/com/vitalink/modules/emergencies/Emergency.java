package br.com.vitalink.modules.emergencies;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.vitalink.modules.auth.AppUser;
import br.com.vitalink.modules.fleet.Ambulance;
import br.com.vitalink.modules.hospital.AmbulanceCrewMember;
import br.com.vitalink.modules.institutions.Institution;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "emergencies")
public class Emergency {
    @Id
    public UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    public AppUser patient;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "central_id")
    public Institution central;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    public Institution hospital;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambulance_id")
    public Ambulance ambulance;
    @ManyToMany
    @JoinTable(name = "emergency_ambulance_crew", joinColumns = @JoinColumn(name = "emergency_id"), inverseJoinColumns = @JoinColumn(name = "crew_member_id"))
    public List<AmbulanceCrewMember> crewMembers = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    public EmergencyStatus status;
    @Column(name = "is_simulation")
    public boolean simulation = true;
    @Column(name = "location_source")
    public String locationSource;
    @Column(name = "manual_address", length = 300)
    public String address = "";
    @Column(name = "reference_point", length = 200)
    public String referencePoint = "";
    public Double latitude;
    public Double longitude;
    @Column(name = "accuracy_meters")
    public Double accuracyMeters;
    @Column(length = 500)
    public String notes = "";
    @Version
    public long version;
    @Column(name = "created_at")
    public Instant createdAt = Instant.now();
    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();
    @Column(name = "closed_at")
    public Instant closedAt;

    public Emergency() {
    }
}
