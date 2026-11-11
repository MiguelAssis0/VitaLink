package br.com.vitalink.modules.patients;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.modules.auth.UserRepository;
import br.com.vitalink.modules.audit.AuditService;
import br.com.vitalink.modules.emergencies.*;
import br.com.vitalink.shared.api.Api;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PatientDataService {
    private final EmergencyContactRepository contacts;
    private final PrivacyRequestRepository requests;
    private final MedicalProfileRepository profiles;
    private final EmergencyRepository emergencies;
    private final StatusEventRepository events;
    private final AuditService audit;
    private final UserRepository users;
    public PatientDataService(EmergencyContactRepository contacts,PrivacyRequestRepository requests,MedicalProfileRepository profiles,
            EmergencyRepository emergencies,StatusEventRepository events,AuditService audit,UserRepository users) {
        this.contacts=contacts; this.requests=requests; this.profiles=profiles; this.emergencies=emergencies; this.events=events; this.audit=audit; this.users=users;
    }

    @Transactional(readOnly=true)
    public List<Api.EmergencyContactResponse> contacts(DemoPrincipal p) {
        MedicalProfileService.requirePatient(p);
        return contacts.findByPatientIdOrderByNameAsc(p.user().id).stream().map(this::contact).toList();
    }
    @Transactional
    public List<Api.EmergencyContactResponse> saveContacts(DemoPrincipal p,List<Api.EmergencyContactRequest> body) {
        MedicalProfileService.requirePatient(p);
        UUID id=p.user().id;
        contacts.deleteByPatientId(id);
        var saved=contacts.saveAll(body.stream().map(c -> new EmergencyContact(id,c)).toList());
        audit.record(p.user(),"EMERGENCY_CONTACTS_UPDATED","PATIENT",id);
        return saved.stream().map(this::contact).toList();
    }
    @Transactional(readOnly=true)
    public List<Api.PrivacyRequestResponse> privacyRequests(DemoPrincipal p) {
        MedicalProfileService.requirePatient(p);
        return requests.findByPatientIdOrderByCreatedAtDesc(p.user().id).stream().map(this::requestView).toList();
    }
    @Transactional
    public Api.PrivacyRequestResult request(DemoPrincipal p,Api.PrivacyRequestType type) {
        MedicalProfileService.requirePatient(p);
        UUID id=p.user().id;
        if(type==Api.PrivacyRequestType.DELETION && requests.existsByPatientIdAndTypeAndStatus(id,type,"PENDING"))
            throw br.com.vitalink.shared.errors.ApiException.conflict("Já existe uma solicitação de exclusão aguardando análise.");
        var saved=requests.save(new PrivacyRequest(id,type));
        audit.record(p.user(),type==Api.PrivacyRequestType.EXPORT?"DATA_EXPORT_REQUESTED":"DATA_DELETION_REQUESTED","PRIVACY_REQUEST",saved.id);
        var export=type==Api.PrivacyRequestType.EXPORT?export(p):null;
        if(export!=null) audit.record(p.user(),"DATA_EXPORTED","PATIENT",id);
        return new Api.PrivacyRequestResult(requestView(saved),export);
    }

    private Api.PatientDataExport export(DemoPrincipal p) {
        var user=users.findById(p.user().id).orElseThrow(br.com.vitalink.shared.errors.ApiException::notFound);
        var profile=profiles.findById(user.id).orElseGet(() -> new MedicalProfile(user.id));
        var basic=new Api.BasicProfileResponse(user.displayName,user.email,user.phone,profile.defaultAddress);
        var medical=new Api.MedicalProfileResponse(profile.defaultAddress,profile.allergies,profile.medications,profile.conditions,profile.notes,true,profile.updatedAt);
        var history=emergencies.findByPatientIdOrderByCreatedAtDesc(user.id).stream().map(e -> new Api.ExportedEmergency(e.id,e.simulation,e.status,e.locationSource,
                e.address,e.referencePoint,e.latitude,e.longitude,e.accuracyMeters,e.notes,e.createdAt,events.findByEmergencyIdOrderByCreatedAtAsc(e.id).stream()
                .map(this::timeline).toList())).toList();
        return new Api.PatientDataExport(Instant.now(),user.createdAt,basic,medical,contacts.findByPatientIdOrderByNameAsc(user.id).stream().map(this::contact).toList(),history,
                requests.findByPatientIdOrderByCreatedAtDesc(user.id).stream().map(this::requestView).toList());
    }
    private Api.TimelineEvent timeline(StatusEvent e) {
        var role=e.actor.getRole();
        String label=switch(role) { case PATIENT -> "Cidadão"; case DISPATCHER -> "Operador da central fictícia"; case HOSPITAL_STAFF -> "Profissional do hospital fictício"; case DEMO_ADMIN -> "Administrador da demonstração"; };
        return new Api.TimelineEvent(e.oldStatus,e.newStatus==null?null:EmergencyStatus.valueOf(e.newStatus),role,label,e.createdAt);
    }
    private Api.EmergencyContactResponse contact(EmergencyContact c) { return new Api.EmergencyContactResponse(c.id,c.name,c.phone,c.relationship); }
    private Api.PrivacyRequestResponse requestView(PrivacyRequest r) { return new Api.PrivacyRequestResponse(r.id,r.type,r.status,r.createdAt,r.completedAt); }
}
