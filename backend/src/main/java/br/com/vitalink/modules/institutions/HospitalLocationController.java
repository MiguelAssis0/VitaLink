package br.com.vitalink.modules.institutions;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class HospitalLocationController {
    private final InstitutionRepository institutions;

    public HospitalLocationController(InstitutionRepository institutions) { this.institutions = institutions; }

    @GetMapping("/hospitals/nearest")
    public NearestHospital nearest(@AuthenticationPrincipal DemoPrincipal principal,
            @RequestParam double latitude, @RequestParam double longitude) {
        if (principal == null || principal.user().role != Role.PATIENT) throw ApiException.forbidden();
        validateCoordinates(latitude, longitude);
        return institutions.findByKindAndAcceptingEmergenciesTrueAndLatitudeIsNotNullAndLongitudeIsNotNull("HOSPITAL").stream()
            .map(hospital -> new NearestHospital(hospital.id, hospital.name, hospital.phone, hospital.latitude,
                hospital.longitude, Math.round(GeoDistance.meters(latitude, longitude, hospital.latitude, hospital.longitude))))
            .min(Comparator.comparingLong(NearestHospital::distanceMeters))
            .orElseThrow(ApiException::notFound);
    }

    @GetMapping("/hospital/location")
    public HospitalLocation location(@AuthenticationPrincipal DemoPrincipal principal) {
        var hospital = hospital(principal);
        return new HospitalLocation(hospital.id, hospital.name, hospital.phone, hospital.latitude, hospital.longitude, hospital.acceptingEmergencies);
    }

    @PutMapping("/hospital/location")
    public HospitalLocation updateLocation(@AuthenticationPrincipal DemoPrincipal principal,
            @Valid @RequestBody UpdateHospitalLocation body) {
        var hospital = hospital(principal);
        hospital.latitude = body.latitude();
        hospital.longitude = body.longitude();
        hospital.phone = body.phone().strip();
        hospital.acceptingEmergencies = body.acceptingEmergencies();
        var saved = institutions.save(hospital);
        return new HospitalLocation(saved.id, saved.name, saved.phone, saved.latitude, saved.longitude, saved.acceptingEmergencies);
    }

    private Institution hospital(DemoPrincipal principal) {
        if (principal == null || principal.user().role != Role.HOSPITAL_STAFF || principal.user().institution == null
                || !"HOSPITAL".equals(principal.user().institution.kind)) throw ApiException.forbidden();
        return principal.user().institution;
    }

    private static void validateCoordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90
                || !Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Coordenadas inválidas.");
        }
    }

    public record UpdateHospitalLocation(@NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @NotBlank @Size(max=30) @Pattern(regexp="\\+?[0-9() .-]{7,30}") String phone,
            @NotNull Boolean acceptingEmergencies) { }
    public record HospitalLocation(UUID id, String name, String phone, Double latitude, Double longitude, boolean acceptingEmergencies) { }
    public record NearestHospital(UUID id, String name, String phone, double latitude, double longitude, long distanceMeters) { }
}
