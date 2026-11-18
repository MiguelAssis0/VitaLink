package br.com.vitalink.modules.patients;

import java.util.UUID;

import br.com.vitalink.shared.api.Api;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "emergency_contacts")
public class EmergencyContact {
    @Id
    public UUID id;
    @Column(name = "patient_id", nullable = false)
    public UUID patientId;
    @Column(nullable = false, length = 120)
    public String name;
    @Column(nullable = false, length = 30)
    public String phone;
    @Column(nullable = false, length = 80)
    public String relationship = "";
    @Column(name = "sms_opt_in", nullable = false)
    public boolean smsOptIn;

    protected EmergencyContact() {
    }

    EmergencyContact(UUID patientId, Api.EmergencyContactRequest contact) {
        this.id = UUID.randomUUID();
        this.patientId = patientId;
        this.name = contact.name().strip();
        this.phone = contact.phone().strip();
        this.relationship = contact.relationship() == null ? "" : contact.relationship().strip();
        this.smsOptIn = Boolean.TRUE.equals(contact.smsOptIn());
    }
}
