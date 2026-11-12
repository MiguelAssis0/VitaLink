package br.com.vitalink.modules.patients;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.api.Api;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/patients/me")
public class PatientController {
    private final MedicalProfileService profiles;
    private final PatientDataService data;
    public PatientController(MedicalProfileService profiles,PatientDataService data) { this.profiles=profiles; this.data=data; }
    @GetMapping public Api.BasicProfileResponse getProfile(@AuthenticationPrincipal DemoPrincipal p) { return profiles.getBasic(p); }
    @PutMapping public Api.BasicProfileResponse saveProfile(@AuthenticationPrincipal DemoPrincipal p,@Valid @RequestBody Api.BasicProfileRequest body) { return profiles.saveBasic(p,body); }
    @GetMapping("/emergency-contacts") public List<Api.EmergencyContactResponse> contacts(@AuthenticationPrincipal DemoPrincipal p) { return data.contacts(p); }
    @PutMapping("/emergency-contacts") public List<Api.EmergencyContactResponse> saveContacts(@AuthenticationPrincipal DemoPrincipal p,@Valid @RequestBody @jakarta.validation.constraints.Size(max=3) List<Api.EmergencyContactRequest> body) { return data.saveContacts(p,body); }
    @DeleteMapping("/emergency-contacts/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContact(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { data.deleteContact(p,id); }
    @GetMapping("/privacy-requests") public List<Api.PrivacyRequestResponse> requests(@AuthenticationPrincipal DemoPrincipal p) { return data.privacyRequests(p); }
    @PostMapping("/privacy-requests") public Api.PrivacyRequestResult request(@AuthenticationPrincipal DemoPrincipal p,@Valid @RequestBody Api.PrivacyRequestBody body) { return data.request(p,body.type()); }
}
