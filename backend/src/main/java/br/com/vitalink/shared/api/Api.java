package br.com.vitalink.shared.api;

import br.com.vitalink.modules.emergencies.EmergencyStatus;

import br.com.vitalink.shared.domain.Role;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class Api {
    private Api() {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank @Size(max=200) String password) {}
    public record RegisterRequest(@NotBlank @Size(max=120) String displayName, @NotBlank @Email @Size(max=254) String email,
                                  @NotBlank @Size(min=8,max=200) @Pattern(regexp="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,200}$") String password,
                                  @NotNull @AssertTrue Boolean adultConfirmed) {}
    public record RegistrationResponse(String message) {}
    public record UserResponse(UUID id, String displayName, String email, Role role, String institutionName) {}
    public record Location(@NotNull LocationSource source, @Size(max=300) String address, @Size(max=200) String reference,
                    @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
                    @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
                    @DecimalMin("0.0") @DecimalMax("100000.0") Double accuracyMeters) {}
    public record CreateEmergencyRequest(@NotNull @Valid Location location, @Size(max=500) String notes) {}
    public record EmergencyResponse(UUID id, boolean simulation, EmergencyStatus status, long version, String message, Instant createdAt) {}
    public record TransitionRequest(@NotNull EmergencyStatus status, @NotNull @PositiveOrZero Long expectedVersion) {}
    public record AssignmentRequest(@NotNull UUID hospitalInstitutionId) {}
    public record EmergencySummary(UUID id, boolean simulation, EmergencyStatus status, String locationSource, String address,
                            String reference, Double latitude, Double longitude, Double accuracyMeters, String notes,
                            long version, Instant createdAt, String hospitalName) {}
    public record HospitalEmergencySummary(UUID id, boolean simulation, EmergencyStatus status, long version, Instant createdAt) {}
    public record MedicalProfileRequest(@Size(max=240) String address, @Size(max=1000) String allergies, @Size(max=1000) String medications,
                                 @Size(max=1000) String conditions, @Size(max=1000) String notes) {}
    public record MedicalProfileResponse(String address, String allergies, String medications, String conditions, String notes,
                                  boolean selfReported, Instant updatedAt) {}
    public record MedicalSummary(String patientDisplayName, String allergies, String medications, String conditions,
                         String notes, boolean selfReported, Instant updatedAt) {}
    public record TimelineEvent(String oldStatus, EmergencyStatus status, Role actorRole, String actorLabel, Instant occurredAt) {}
    public record ErrorResponse(String code, String title, String detail, Instant timestamp) {}
    public enum LocationSource { BROWSER, MANUAL }
}
