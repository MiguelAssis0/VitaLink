package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.api.Api;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/v1")
public class EmergencyController {
    private final EmergencyService service;
    public EmergencyController(EmergencyService service) { this.service=service; }
    @PostMapping("/emergencies")
    public Api.EmergencyResponse create(@AuthenticationPrincipal DemoPrincipal p, @RequestHeader(value="Idempotency-Key",required=false) String key,
                                 @Valid @RequestBody Api.CreateEmergencyRequest body) { return service.create(p,body,key); }
    @GetMapping("/emergencies/mine")
    public Page<Api.EmergencySummary> mine(@AuthenticationPrincipal DemoPrincipal p,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.patientList(p,page,size); }
    @GetMapping("/emergencies/{id}") public Object detail(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return service.detail(p,id); }
    @GetMapping("/emergencies/{id}/events") public List<Api.TimelineEvent> events(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return service.timeline(p,id); }
    @PostMapping("/emergencies/{id}/request-cancel") public Api.EmergencyResponse cancel(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return service.requestCancel(p,id); }
    @GetMapping("/central/emergencies")
    public Page<Api.EmergencySummary> central(@AuthenticationPrincipal DemoPrincipal p,@RequestParam(required=false) EmergencyStatus status,
                                       @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.centralList(p,status,page,size); }
    @PostMapping("/central/emergencies/{id}/transitions")
    public Api.EmergencyResponse transition(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id,@Valid @RequestBody Api.TransitionRequest body) { return service.transition(p,id,body); }
    @PostMapping("/central/emergencies/{id}/hospital-assignment")
    public Api.EmergencyResponse assign(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id,@Valid @RequestBody Api.AssignmentRequest body) { return service.assignHospital(p,id,body.hospitalInstitutionId()); }
    @GetMapping("/central/emergencies/{id}/medical-summary")
    public Api.MedicalSummary centralMedical(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return service.medicalSummary(p,id); }
    @GetMapping("/hospital/emergencies")
    public Page<Api.HospitalEmergencySummary> hospital(@AuthenticationPrincipal DemoPrincipal p,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.hospitalList(p,page,size); }
    @GetMapping("/hospital/emergencies/{id}") public Object hospitalDetail(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return service.detail(p,id); }
    @GetMapping("/hospital/emergencies/{id}/medical-summary")
    public Api.MedicalSummary hospitalMedical(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return service.medicalSummary(p,id); }
}
