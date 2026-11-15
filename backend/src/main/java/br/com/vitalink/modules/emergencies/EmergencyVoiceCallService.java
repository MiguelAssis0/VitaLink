package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.modules.audit.AuditService;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmergencyVoiceCallService {
    private enum Status { RINGING, CONNECTED, DECLINED, ENDED }
    private static final List<EmergencyStatus> OPEN = List.of(EmergencyStatus.REQUESTED, EmergencyStatus.ACKNOWLEDGED,
        EmergencyStatus.RESOURCE_ASSIGNED, EmergencyStatus.EN_ROUTE, EmergencyStatus.ON_SCENE, EmergencyStatus.CANCEL_REQUESTED);
    // shortcut: call signaling is in memory and assumes one backend instance; use shared signaling before scaling.
    private final ConcurrentHashMap<UUID, Call> calls = new ConcurrentHashMap<>();
    private final EmergencyRepository emergencies;
    private final AuditService audit;

    public EmergencyVoiceCallService(EmergencyRepository emergencies, AuditService audit) {
        this.emergencies=emergencies; this.audit=audit;
    }

    @Transactional
    public synchronized Api.VoiceCallResponse start(DemoPrincipal principal, UUID emergencyId) {
        requireDispatcher(principal);
        var emergency=emergencies.findById(emergencyId).filter(item -> item.central.getId().equals(principal.user().institution.getId())).orElseThrow(ApiException::notFound);
        if (!emergency.status.open()) throw ApiException.conflict("A ocorrência está encerrada.");
        prune();
        if (calls.values().stream().anyMatch(call -> call.emergencyId.equals(emergencyId) && active(call.status)))
            throw ApiException.conflict("Já existe uma chamada ativa para esta ocorrência.");
        var call=new Call(UUID.randomUUID(),emergencyId,emergency.patient.getId(),principal.user().institution.getId());
        calls.put(call.id,call);
        audit.record(principal.user(),"VOICE_CALL_STARTED","EMERGENCY",emergencyId);
        return response(call);
    }

    @Transactional(readOnly=true)
    public Api.VoiceCallResponse getForDispatcher(DemoPrincipal principal, UUID emergencyId) {
        requireDispatcher(principal);
        return calls.values().stream().filter(call -> call.emergencyId.equals(emergencyId) && call.centralId.equals(principal.user().institution.getId()))
            .max(java.util.Comparator.comparing(call -> call.createdAt)).map(EmergencyVoiceCallService::response).orElseThrow(ApiException::notFound);
    }

    public Optional<Api.VoiceCallResponse> activeForPatient(DemoPrincipal principal) {
        requirePatient(principal); prune();
        return calls.values().stream().filter(call -> call.patientId.equals(principal.user().id) && active(call.status))
            .max(java.util.Comparator.comparing(call -> call.createdAt)).map(EmergencyVoiceCallService::response);
    }

    public Api.VoiceCallResponse offer(DemoPrincipal principal, UUID id, String sdp) {
        var call=dispatcherCall(principal,id);
        synchronized (call) {
            if (call.offer!=null || !active(call.status)) throw ApiException.conflict("A chamada não pode receber esta oferta.");
            call.offer=sdp;
            return response(call);
        }
    }

    public Api.VoiceCallResponse answer(DemoPrincipal principal, UUID id, String sdp) {
        var call=patientCall(principal,id);
        synchronized (call) {
            if (call.offer==null || call.answer!=null || !active(call.status)) throw ApiException.conflict("A chamada não pode receber esta resposta.");
            call.answer=sdp;
            return response(call);
        }
    }

    public Api.VoiceCallResponse connected(DemoPrincipal principal, UUID id) {
        var call=participantCall(principal,id);
        synchronized (call) {
            if (call.offer==null || call.answer==null || !active(call.status)) throw ApiException.conflict("A chamada ainda não está pronta.");
            call.status=Status.CONNECTED;
            return response(call);
        }
    }

    public Api.VoiceCallResponse end(DemoPrincipal principal, UUID id, boolean declined) {
        var call=participantCall(principal,id);
        synchronized (call) {
            if (active(call.status)) {
                call.status=declined && principal.user().role==Role.PATIENT?Status.DECLINED:Status.ENDED;
                call.endedAt=Instant.now();
                audit.record(principal.user(),declined?"VOICE_CALL_DECLINED":"VOICE_CALL_ENDED","EMERGENCY",call.emergencyId);
            }
            return response(call);
        }
    }

    private Call dispatcherCall(DemoPrincipal principal, UUID id) {
        requireDispatcher(principal);
        return Optional.ofNullable(calls.get(id)).filter(call -> call.centralId.equals(principal.user().institution.getId())).orElseThrow(ApiException::notFound);
    }
    private Call patientCall(DemoPrincipal principal, UUID id) {
        requirePatient(principal);
        return Optional.ofNullable(calls.get(id)).filter(call -> call.patientId.equals(principal.user().id)).orElseThrow(ApiException::notFound);
    }
    private Call participantCall(DemoPrincipal principal, UUID id) {
        return principal.user().role==Role.DISPATCHER?dispatcherCall(principal,id):patientCall(principal,id);
    }
    private void prune() {
        Instant now=Instant.now();
        calls.values().removeIf(call -> active(call.status) && call.status==Status.RINGING && now.isAfter(call.createdAt.plusSeconds(90))
            || !active(call.status) && call.endedAt!=null && now.isAfter(call.endedAt.plusSeconds(300)));
    }
    private static Api.VoiceCallResponse response(Call call) {
        synchronized (call) { return new Api.VoiceCallResponse(call.id,call.emergencyId,call.status.name(),call.offer,call.answer); }
    }
    private static boolean active(Status status) { return status==Status.RINGING || status==Status.CONNECTED; }
    private static void requireDispatcher(DemoPrincipal p) {
        if (p==null || p.user().role!=Role.DISPATCHER || p.user().institution==null) throw ApiException.forbidden();
    }
    private static void requirePatient(DemoPrincipal p) {
        if (p==null || p.user().role!=Role.PATIENT) throw ApiException.forbidden();
    }

    private static final class Call {
        final UUID id, emergencyId, patientId, centralId;
        final Instant createdAt=Instant.now();
        volatile Status status=Status.RINGING;
        volatile String offer, answer;
        volatile Instant endedAt;
        Call(UUID id, UUID emergencyId, UUID patientId, UUID centralId) {
            this.id=id; this.emergencyId=emergencyId; this.patientId=patientId; this.centralId=centralId;
        }
    }
}
