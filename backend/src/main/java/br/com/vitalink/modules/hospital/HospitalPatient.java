package br.com.vitalink.modules.hospital;

import br.com.vitalink.modules.institutions.Institution;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name="hospital_patients")
public class HospitalPatient {
    @Id public UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="hospital_id", nullable=false) public Institution hospital;
    @Column(nullable=false, length=120) public String name;
    @Column(name="birth_date", nullable=false) public LocalDate birthDate;
    @Column(nullable=false, length=30) public String phone="";
    @Column(name="created_at", nullable=false) public Instant createdAt=Instant.now();
    protected HospitalPatient() {}
    public HospitalPatient(Institution hospital, String name, LocalDate birthDate, String phone) {
        this.id=UUID.randomUUID(); this.hospital=hospital; this.name=name; this.birthDate=birthDate; this.phone=phone;
    }
}
