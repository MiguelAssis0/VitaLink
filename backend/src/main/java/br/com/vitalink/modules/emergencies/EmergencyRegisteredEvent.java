package br.com.vitalink.modules.emergencies;

import java.time.Instant;
import java.util.UUID;

public record EmergencyRegisteredEvent(UUID emergencyId, UUID patientId, String address, Double latitude,
        Double longitude, String ambulanceCode, String hospitalName, Instant createdAt) { }
