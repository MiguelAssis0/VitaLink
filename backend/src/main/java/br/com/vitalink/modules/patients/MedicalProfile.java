package br.com.vitalink.modules.patients;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "medical_profiles")
public class MedicalProfile {
    @Id
    @Column(name = "patient_id")
    public UUID patientId;
    @Column(name = "default_address", length = 240, nullable = false)
    public String defaultAddress = "";
    @Column(length = 1000)
    public String allergies = "";
    @Column(length = 1000)
    public String medications = "";
    @Column(length = 1000)
    public String conditions = "";
    @Column(length = 1000)
    public String notes = "";
    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    protected MedicalProfile() {
    }

    public MedicalProfile(UUID patientId) {
        this.patientId = patientId;
    }
}
