package br.com.vitalink.modules.patients;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.modules.auth.UserRepository;
import br.com.vitalink.modules.audit.AuditService;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class MedicalProfileService {
    private final MedicalProfileRepository profiles;
    private final UserRepository users;
    private final AuditService audit;
    public MedicalProfileService(MedicalProfileRepository profiles, UserRepository users, AuditService audit) {
        this.profiles=profiles; this.users=users; this.audit=audit;
    }
    @Transactional(readOnly=true)
    public Api.BasicProfileResponse getBasic(DemoPrincipal principal) {
        requirePatient(principal);
        var user=users.findById(principal.user().id).orElseThrow(ApiException::notFound);
        var profile=profiles.findById(user.id).orElse(null);
        return new Api.BasicProfileResponse(user.displayName,user.email,user.phone,profile==null?"":profile.defaultAddress);
    }
    @Transactional
    public Api.BasicProfileResponse saveBasic(DemoPrincipal principal,Api.BasicProfileRequest body) {
        requirePatient(principal);
        var user=users.findById(principal.user().id).orElseThrow(ApiException::notFound);
        user.displayName=body.displayName().strip(); user.phone=safe(body.phone());
        users.save(user);
        var profile=profiles.findById(user.id).orElseGet(() -> new MedicalProfile(user.id));
        profile.defaultAddress=safe(body.address()); profile.updatedAt=Instant.now(); profiles.save(profile);
        audit.record(user,"BASIC_PROFILE_UPDATED","PATIENT",user.id);
        return new Api.BasicProfileResponse(user.displayName,user.email,user.phone,profile.defaultAddress);
    }
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
        var saved=profiles.save(profile);
        audit.record(principal.user(),"MEDICAL_PROFILE_UPDATED","PATIENT",principal.user().id);
        return view(saved);
    }
    public static void requirePatient(DemoPrincipal principal) {
        if(principal.user().role!=Role.PATIENT) throw ApiException.forbidden();
    }
    private static String safe(String value) { return value==null?"":value.strip(); }
    private static Api.MedicalProfileResponse view(MedicalProfile p) {
        return new Api.MedicalProfileResponse(p.defaultAddress,p.allergies,p.medications,p.conditions,p.notes,true,p.updatedAt);
    }
}
