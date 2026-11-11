package br.com.vitalink.modules.fleet;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.modules.hospital.AmbulanceCrewMember;
import br.com.vitalink.modules.hospital.AmbulanceCrewRepository;
import br.com.vitalink.modules.hospital.HospitalPatient;
import br.com.vitalink.modules.hospital.HospitalPatientRepository;
import br.com.vitalink.modules.audit.AuditService;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/v1")
public class OperationsRegistryController {
    private final AmbulanceRepository ambulances;
    private final AmbulanceCrewRepository crew;
    private final HospitalPatientRepository patients;
    private final AuditService audit;

    public OperationsRegistryController(AmbulanceRepository ambulances, AmbulanceCrewRepository crew,
                                        HospitalPatientRepository patients, AuditService audit) {
        this.ambulances=ambulances; this.crew=crew; this.patients=patients; this.audit=audit;
    }

    @GetMapping("/central/ambulances")
    public List<Api.AmbulanceResponse> ambulances(@AuthenticationPrincipal DemoPrincipal principal) {
        var central=central(principal);
        return ambulances.findByCentralIdOrderByCodeAsc(central.getId()).stream().map(this::ambulanceResponse).toList();
    }

    @PostMapping("/central/ambulances") @ResponseStatus(HttpStatus.CREATED)
    public Api.AmbulanceResponse addAmbulance(@AuthenticationPrincipal DemoPrincipal principal,
                                               @Valid @RequestBody Api.AmbulanceRequest body) {
        var central=central(principal);
        var code=body.code().strip();
        if (ambulances.existsByCentralIdAndCodeIgnoreCase(central.getId(),code)) throw ApiException.conflict("Já existe uma ambulância com esse identificador.");
        var created=ambulances.save(new Ambulance(central,code,AmbulanceStatus.AVAILABLE));
        audit.record(principal.user(),"AMBULANCE_CREATED","AMBULANCE",created.id);
        return ambulanceResponse(created);
    }

    @PutMapping("/central/ambulances/{id}/status")
    public Api.AmbulanceResponse updateAmbulanceStatus(@AuthenticationPrincipal DemoPrincipal principal,
            @PathVariable UUID id, @Valid @RequestBody Api.AmbulanceStatusRequest body) {
        var central=central(principal);
        var ambulance=ambulances.findById(id).filter(item -> item.central.getId().equals(central.getId())).orElseThrow(ApiException::notFound);
        ambulance.status=body.status();
        var updated=ambulances.save(ambulance);
        audit.record(principal.user(),"AMBULANCE_STATUS_UPDATED","AMBULANCE",updated.id);
        return ambulanceResponse(updated);
    }

    @GetMapping("/hospital/ambulance-crew")
    public List<Api.AmbulanceCrewResponse> crew(@AuthenticationPrincipal DemoPrincipal principal) {
        var hospital=hospital(principal);
        audit.record(principal.user(),"HOSPITAL_CREW_LIST_READ","HOSPITAL_CREW",null);
        return crew.findByHospitalIdOrderByNameAsc(hospital.getId()).stream().map(this::crewResponse).toList();
    }

    @PostMapping("/hospital/ambulance-crew") @ResponseStatus(HttpStatus.CREATED)
    public Api.AmbulanceCrewResponse addCrewMember(@AuthenticationPrincipal DemoPrincipal principal,
            @Valid @RequestBody Api.AmbulanceCrewRequest body) {
        var member=crew.save(new AmbulanceCrewMember(hospital(principal),body.name().strip(),body.position().strip(),safe(body.phone())));
        audit.record(principal.user(),"HOSPITAL_CREW_REGISTERED","HOSPITAL_CREW",member.id);
        return crewResponse(member);
    }

    @GetMapping("/hospital/patients")
    public List<Api.HospitalPatientResponse> patients(@AuthenticationPrincipal DemoPrincipal principal) {
        var hospital=hospital(principal);
        audit.record(principal.user(),"HOSPITAL_PATIENT_LIST_READ","HOSPITAL_PATIENT",null);
        return patients.findByHospitalIdOrderByCreatedAtDesc(hospital.getId()).stream().map(this::patientResponse).toList();
    }

    @PostMapping("/hospital/patients") @ResponseStatus(HttpStatus.CREATED)
    public Api.HospitalPatientResponse addPatient(@AuthenticationPrincipal DemoPrincipal principal,
            @Valid @RequestBody Api.HospitalPatientRequest body) {
        var patient=patients.save(new HospitalPatient(hospital(principal),body.name().strip(),body.birthDate(),safe(body.phone())));
        audit.record(principal.user(),"HOSPITAL_PATIENT_REGISTERED","HOSPITAL_PATIENT",patient.id);
        return patientResponse(patient);
    }

    private Api.AmbulanceResponse ambulanceResponse(Ambulance item) {
        return new Api.AmbulanceResponse(item.id,item.code,item.status);
    }
    private Api.AmbulanceCrewResponse crewResponse(AmbulanceCrewMember item) {
        return new Api.AmbulanceCrewResponse(item.id,item.name,item.position,item.phone,item.createdAt);
    }
    private Api.HospitalPatientResponse patientResponse(HospitalPatient item) {
        return new Api.HospitalPatientResponse(item.id,item.name,item.birthDate,item.phone,item.createdAt);
    }
    private static br.com.vitalink.modules.institutions.Institution central(DemoPrincipal principal) {
        if (principal==null || principal.user().role!=Role.DISPATCHER || principal.user().institution==null) throw ApiException.forbidden();
        return principal.user().institution;
    }
    private static br.com.vitalink.modules.institutions.Institution hospital(DemoPrincipal principal) {
        if (principal==null || principal.user().role!=Role.HOSPITAL_STAFF || principal.user().institution==null) throw ApiException.forbidden();
        return principal.user().institution;
    }
    private static String safe(String value) { return value==null?"":value.strip(); }
}
