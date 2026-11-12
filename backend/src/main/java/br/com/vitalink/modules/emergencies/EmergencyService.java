package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.AppUser;
import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.modules.audit.AuditService;
import br.com.vitalink.modules.fleet.Ambulance;
import br.com.vitalink.modules.fleet.AmbulanceRepository;
import br.com.vitalink.modules.fleet.AmbulanceStatus;
import br.com.vitalink.modules.institutions.GeoDistance;
import br.com.vitalink.modules.institutions.Institution;
import br.com.vitalink.modules.institutions.InstitutionRepository;
import br.com.vitalink.modules.institutions.InstitutionService;
import br.com.vitalink.modules.patients.MedicalProfile;
import br.com.vitalink.modules.patients.MedicalProfileRepository;
import br.com.vitalink.modules.patients.MedicalProfileService;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class EmergencyService {
    private final EmergencyRepository emergencies;
    private final InstitutionService institutions;
    private final InstitutionRepository institutionRepository;
    private final AmbulanceRepository ambulances;
    private final MedicalProfileRepository profiles;
    private final IdempotencyRecordRepository idempotency; private final StatusEventRepository events;
    private final AccessGrantRepository grants; private final AuditService audit; private final ObjectMapper mapper;
    private final ApplicationEventPublisher publisher;
    public EmergencyService(EmergencyRepository emergencies, InstitutionService institutions, MedicalProfileRepository profiles,
                     IdempotencyRecordRepository idempotency, StatusEventRepository events, AccessGrantRepository grants,
                     AuditService audit, ObjectMapper mapper, InstitutionRepository institutionRepository, AmbulanceRepository ambulances,
                     ApplicationEventPublisher publisher) {
        this.emergencies=emergencies; this.institutions=institutions; this.institutionRepository=institutionRepository;
        this.ambulances=ambulances; this.profiles=profiles;
        this.idempotency=idempotency; this.events=events; this.grants=grants; this.audit=audit; this.mapper=mapper; this.publisher=publisher;
    }

    @Transactional
    Api.EmergencyResponse create(DemoPrincipal principal, Api.CreateEmergencyRequest body, String key) {
        var actor=principal.user(); MedicalProfileService.requirePatient(principal);
        if (body.location().source()==Api.LocationSource.MANUAL && (body.location().address()==null || body.location().address().isBlank()))
            throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST,"LOCATION_REQUIRED","Informe um endereço manual.");
        if (body.location().source()==Api.LocationSource.BROWSER && (body.location().latitude()==null || body.location().longitude()==null))
            throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST,"LOCATION_REQUIRED","Confirme as coordenadas retornadas pelo navegador.");
        if (key == null || key.length()<8 || key.length()>100) throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST,"IDEMPOTENCY_KEY_REQUIRED","Envie uma chave Idempotency-Key de 8 a 100 caracteres.");
        String keyHash=sha256(key), requestHash=sha256(json(body));
        var prior=idempotency.findByUserIdAndKeyHash(actor.id,keyHash);
        if (prior.isPresent()) {
            if (!prior.get().requestHash.equals(requestHash)) throw ApiException.conflict("A chave de idempotência já foi usada com outro conteúdo.");
            return response(prior.get().emergency);
        }
        if (emergencies.existsByPatientIdAndStatusIn(actor.id, List.of(EmergencyStatus.REQUESTED, EmergencyStatus.ACKNOWLEDGED, EmergencyStatus.RESOURCE_ASSIGNED, EmergencyStatus.EN_ROUTE, EmergencyStatus.ON_SCENE, EmergencyStatus.CANCEL_REQUESTED)))
            throw ApiException.conflict("Já existe uma ocorrência simulada aberta.");
        var event=new Emergency(); event.id=UUID.randomUUID(); event.patient=actor;
        event.central=institutions.demoCentral();
        event.status=EmergencyStatus.REQUESTED; event.simulation=true; event.locationSource=body.location().source().name();
        event.address=safe(body.location().address()); event.referencePoint=safe(body.location().reference());
        event.latitude=body.location().latitude(); event.longitude=body.location().longitude(); event.accuracyMeters=body.location().accuracyMeters(); event.notes=safe(body.notes());
        emergencies.save(event); events.save(new StatusEvent(event,null,event.status.name(),actor));
        if (dispatchAutomatically(event,actor)) emergencies.save(event);
        idempotency.save(new IdempotencyRecord(actor,keyHash,requestHash,event)); audit.record(actor,"EMERGENCY_CREATED","EMERGENCY",event.id);
        publisher.publishEvent(new EmergencyRegisteredEvent(event.id,actor.id,event.address,event.latitude,event.longitude,
            event.ambulance==null?null:event.ambulance.code,event.hospital==null?null:event.hospital.getName(),event.createdAt));
        return response(event);
    }

    @Transactional(readOnly=true)
    Page<Api.EmergencySummary> patientList(DemoPrincipal p, int page, int size) {
        MedicalProfileService.requirePatient(p);
        return emergencies.findByPatientIdOrderByCreatedAtDesc(p.user().id,paging(page,size)).map(this::summary);
    }
    @Transactional(readOnly=true)
    Page<Api.EmergencySummary> centralList(DemoPrincipal p, EmergencyStatus status, int page, int size) {
        requireDispatcher(p);
        Page<Emergency> result=status==null ? emergencies.findByCentralIdOrderByCreatedAtDesc(p.user().institution.getId(),paging(page,size)) : emergencies.findByCentralIdAndStatusOrderByCreatedAtDesc(p.user().institution.getId(),status,paging(page,size));
        return result.map(this::summary);
    }
    @Transactional(readOnly=true)
    Page<Api.HospitalEmergencySummary> hospitalList(DemoPrincipal p, int page, int size) {
        requireHospital(p);
        var result=emergencies.findByHospitalIdOrderByCreatedAtDesc(p.user().institution.getId(),paging(page,size));
        var visible=result.getContent().stream().filter(e -> grants.existsActive(e.id,p.user().institution.getId(),Instant.now())).map(this::hospitalSummary).toList();
        return new PageImpl<>(visible,result.getPageable(),result.getTotalElements());
    }
    @Transactional(readOnly=true)
    Object detail(DemoPrincipal p, UUID id) { var e=authorized(p,id); return p.user().role==Role.HOSPITAL_STAFF?hospitalSummary(e):summary(e); }
    @Transactional(readOnly=true)
    List<Api.TimelineEvent> timeline(DemoPrincipal p, UUID id) {
        var e=authorized(p,id);
        return events.findByEmergencyIdOrderByCreatedAtAsc(e.id).stream().map(x -> new Api.TimelineEvent(x.oldStatus,x.newStatus==null?null:EmergencyStatus.valueOf(x.newStatus),x.actor.getRole(),x.automatic?"Despacho automático":label(x.actor.getRole()),x.createdAt)).toList();
    }
    @Transactional
    Api.EmergencyResponse transition(DemoPrincipal p, UUID id, Api.TransitionRequest body) {
        requireDispatcher(p); var e=centralEmergency(p,id);
        if (e.version != body.expectedVersion()) throw ApiException.conflict("A ocorrência foi atualizada. Recarregue e tente novamente.");
        if (!e.status.canTransitionTo(body.status())) throw ApiException.conflict("Transição de estado inválida.");
        setStatus(e,body.status(),p.user());
        return response(emergencies.saveAndFlush(e));
    }
    @Transactional
    Api.EmergencyResponse requestCancel(DemoPrincipal p, UUID id) {
        MedicalProfileService.requirePatient(p); var e=emergencies.findById(id).filter(x -> x.patient.getId().equals(p.user().id)).orElseThrow(ApiException::notFound);
        if (!e.status.canTransitionTo(EmergencyStatus.CANCEL_REQUESTED)) throw ApiException.conflict("Esta ocorrência não pode mais receber pedido de cancelamento.");
        setStatus(e,EmergencyStatus.CANCEL_REQUESTED,p.user()); return response(emergencies.save(e));
    }
    @Transactional
    Api.EmergencyResponse assignHospital(DemoPrincipal p, UUID id, UUID hospitalId) {
        requireDispatcher(p); var e=centralEmergency(p,id);
        if (!e.status.open()) throw ApiException.conflict("A ocorrência está encerrada.");
        var hospital=institutions.demoHospital(hospitalId);
        if (!hospital.acceptingEmergencies) throw ApiException.conflict("Este hospital não está recebendo novas ocorrências.");
        e.hospital=hospital; e.updatedAt=Instant.now();
        grants.findByEmergencyIdAndRevokedAtIsNull(e.id).forEach(g -> g.revokedAt=Instant.now());
        grants.save(new AccessGrant(e,hospital,p.user(),null));
        audit.record(p.user(),"HOSPITAL_GRANT_CREATED","EMERGENCY",e.id);
        return response(emergencies.saveAndFlush(e));
    }
    @Transactional
    Api.MedicalSummary medicalSummary(DemoPrincipal p, UUID id) {
        var e=authorized(p,id);
        if (p.user().role==Role.HOSPITAL_STAFF && !grants.existsActive(e.id,p.user().institution.getId(),Instant.now())) throw ApiException.notFound();
        if (p.user().role!=Role.HOSPITAL_STAFF && p.user().role!=Role.DISPATCHER) throw ApiException.notFound();
        var profile=profiles.findById(e.patient.getId()).orElseThrow(ApiException::notFound);
        audit.record(p.user(),"MEDICAL_SUMMARY_READ","EMERGENCY",e.id);
        return new Api.MedicalSummary(e.patient.getDisplayName(),profile.allergies,profile.medications,profile.conditions,profile.notes,true,profile.updatedAt);
    }
    private Emergency authorized(DemoPrincipal p, UUID id) {
        var e=emergencies.findById(id).orElseThrow(ApiException::notFound);
        return switch(p.user().role) {
            case PATIENT -> e.patient.getId().equals(p.user().id)?e:missing();
            case DISPATCHER -> e.central.getId().equals(p.user().institution.getId())?e:missing();
            case HOSPITAL_STAFF -> e.hospital != null && e.hospital.getId().equals(p.user().institution.getId()) && grants.existsActive(e.id,p.user().institution.getId(),Instant.now())?e:missing();
            default -> missing();
        };
    }
    private Emergency centralEmergency(DemoPrincipal p, UUID id) { return emergencies.findById(id).filter(e -> e.central.getId().equals(p.user().institution.getId())).orElseThrow(ApiException::notFound); }
    private void setStatus(Emergency e, EmergencyStatus next, AppUser actor) {
        var old=e.status; e.status=next; e.updatedAt=Instant.now(); if(next==EmergencyStatus.CLOSED || next==EmergencyStatus.CANCELLED) e.closedAt=Instant.now();
        events.save(new StatusEvent(e,old.name(),next.name(),actor)); audit.record(actor,"STATUS_CHANGED","EMERGENCY",e.id);
        if ((next==EmergencyStatus.CLOSED || next==EmergencyStatus.CANCELLED) && e.ambulance!=null)
            e.ambulance.status=AmbulanceStatus.AVAILABLE;
        if (e.closedAt!=null && e.hospital!=null) grants.active(e.id,e.hospital.getId(),Instant.now()).ifPresent(g -> g.expiresAt=e.closedAt.plus(Duration.ofHours(24)));
    }
    private Api.EmergencySummary summary(Emergency e) { return new Api.EmergencySummary(e.id,true,e.status,e.locationSource,e.address,e.referencePoint,e.latitude,e.longitude,e.accuracyMeters,e.notes,e.version,e.createdAt,e.hospital==null?null:e.hospital.getName(),e.ambulance==null?null:e.ambulance.code); }
    private Api.HospitalEmergencySummary hospitalSummary(Emergency e) { return new Api.HospitalEmergencySummary(e.id,true,e.status,e.version,e.createdAt,e.ambulance==null?null:e.ambulance.code); }
    private Api.EmergencyResponse response(Emergency e) {
        String message=e.ambulance!=null?"Ambulância e hospital selecionados automaticamente nesta simulação. Nenhuma equipe real foi acionada.":
            e.status==EmergencyStatus.REQUESTED?"Pedido simulado registrado; aguardando localização e recursos disponíveis. Nenhuma ambulância real foi acionada.":"Estado atualizado no ambiente de SIMULAÇÃO. Nenhuma ambulância real foi acionada.";
        return new Api.EmergencyResponse(e.id,true,e.status,e.version,message,e.createdAt,e.ambulance==null?null:e.ambulance.code,e.hospital==null?null:e.hospital.getName());
    }
    private boolean dispatchAutomatically(Emergency emergency, AppUser actor) {
        if (!"BROWSER".equals(emergency.locationSource) || emergency.latitude==null || emergency.longitude==null) return false;
        Institution hospital=institutionRepository.findByKindAndAcceptingEmergenciesTrueAndLatitudeIsNotNullAndLongitudeIsNotNull("HOSPITAL").stream()
            .min(Comparator.comparingDouble(item -> GeoDistance.meters(emergency.latitude,emergency.longitude,item.latitude,item.longitude))).orElse(null);
        if (hospital==null) return false;
        Ambulance ambulance=ambulances.lockAvailableWithLocation(emergency.central.getId(),AmbulanceStatus.AVAILABLE).stream()
            .min(Comparator.comparingDouble(item -> GeoDistance.meters(emergency.latitude,emergency.longitude,item.latitude,item.longitude))).orElse(null);
        if (ambulance==null) return false;
        ambulance.status=AmbulanceStatus.OCCUPIED;
        emergency.ambulance=ambulance;
        emergency.hospital=hospital;
        emergency.status=EmergencyStatus.RESOURCE_ASSIGNED;
        emergency.updatedAt=Instant.now();
        grants.save(new AccessGrant(emergency,hospital,actor,null));
        events.save(new StatusEvent(emergency,EmergencyStatus.REQUESTED.name(),EmergencyStatus.RESOURCE_ASSIGNED.name(),actor,true));
        audit.record(actor,"AUTO_DISPATCH_ASSIGNED","EMERGENCY",emergency.id);
        return true;
    }
    private static Emergency missing() { throw ApiException.notFound(); }
    private static void requireDispatcher(DemoPrincipal p) { if (p.user().role!=Role.DISPATCHER || p.user().institution==null) throw ApiException.forbidden(); }
    private static void requireHospital(DemoPrincipal p) { if (p.user().role!=Role.HOSPITAL_STAFF || p.user().institution==null) throw ApiException.forbidden(); }
    private static PageRequest paging(int page,int size) { if(page<0 || size<1 || size>100) throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST,"INVALID_PAGE","Paginação inválida."); return PageRequest.of(page,size,Sort.by(Sort.Direction.DESC,"createdAt")); }
    private String json(Object o) { try { return mapper.writeValueAsString(o); } catch(Exception e) { throw new IllegalStateException(e); } }
    private static String safe(String x) { return x==null?"":x.strip(); }
    private static String label(Role role) { return switch(role) { case PATIENT -> "Cidadão"; case DISPATCHER -> "Operador da central fictícia"; case HOSPITAL_STAFF -> "Profissional do hospital fictício"; case DEMO_ADMIN -> "Administrador da demonstração"; }; }
    private static String sha256(String s) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8))); } catch(Exception e) { throw new IllegalStateException(e); } }
}
