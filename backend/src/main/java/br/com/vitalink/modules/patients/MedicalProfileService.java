package br.com.vitalink.modules.patients;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class MedicalProfileService {
    private final MedicalProfileRepository profiles;
    public MedicalProfileService(MedicalProfileRepository profiles) { this.profiles=profiles; }
    @Transactional(readOnly=true)
    public Api.MedicalProfileResponse get(DemoPrincipal principal) {
        requirePatient(principal);
        return view(profiles.findById(principal.user().id).orElseGet(() -> new MedicalProfile(principal.user().id)));
    }
    @Transactional
    public Api.MedicalProfileResponse save(DemoPrincipal principal,Api.MedicalProfileRequest body) {
        requirePatient(principal);
        var profile=profiles.findById(principal.user().id).orElseGet(() -> new MedicalProfile(principal.user().id));
        profile.defaultAddress=safe(body.address());
        profile.allergies=safe(body.allergies()); profile.medications=safe(body.medications());
        profile.conditions=safe(body.conditions()); profile.notes=safe(body.notes()); profile.updatedAt=Instant.now();
        return view(profiles.save(profile));
    }
    public static void requirePatient(DemoPrincipal principal) {
        if(principal.user().role!=Role.PATIENT) throw ApiException.forbidden();
    }
    private static String safe(String value) { return value==null?"":value.strip(); }
    private static Api.MedicalProfileResponse view(MedicalProfile p) {
        return new Api.MedicalProfileResponse(p.defaultAddress,p.allergies,p.medications,p.conditions,p.notes,true,p.updatedAt);
    }
}
