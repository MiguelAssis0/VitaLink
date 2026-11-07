package br.com.vitalink.modules.patients;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.api.Api;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients/me/medical-profile")
public class MedicalProfileController {
    private final MedicalProfileService service;
    public MedicalProfileController(MedicalProfileService service) { this.service=service; }
    @GetMapping public Api.MedicalProfileResponse get(@AuthenticationPrincipal DemoPrincipal principal) { return service.get(principal); }
    @PutMapping public Api.MedicalProfileResponse put(@AuthenticationPrincipal DemoPrincipal principal,@jakarta.validation.Valid @RequestBody Api.MedicalProfileRequest body) { return service.save(principal,body); }
}
