package br.com.vitalink.modules.patients;

import br.com.vitalink.shared.api.Api;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="privacy_requests")
public class PrivacyRequest {
    @Id public UUID id;
    @Column(name="patient_id", nullable=false) public UUID patientId;
    @Enumerated(EnumType.STRING) @Column(name="request_type", nullable=false, length=20) public Api.PrivacyRequestType type;
    @Column(nullable=false, length=20) public String status;
    @Column(name="created_at", nullable=false) public Instant createdAt=Instant.now();
    @Column(name="completed_at") public Instant completedAt;
    protected PrivacyRequest() {}
    PrivacyRequest(UUID patientId, Api.PrivacyRequestType type) {
        this.id=UUID.randomUUID(); this.patientId=patientId; this.type=type;
        this.status=type==Api.PrivacyRequestType.EXPORT?"COMPLETED":"PENDING";
        if(type==Api.PrivacyRequestType.EXPORT) this.completedAt=this.createdAt;
    }
}
