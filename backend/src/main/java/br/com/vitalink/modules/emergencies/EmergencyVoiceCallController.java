package br.com.vitalink.modules.emergencies;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.api.Api;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/api/v1")
public class EmergencyVoiceCallController {
    private final EmergencyVoiceCallService calls;
    public EmergencyVoiceCallController(EmergencyVoiceCallService calls) { this.calls=calls; }

    @PostMapping("/central/emergencies/{id}/voice-call")
    public Api.VoiceCallResponse start(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return calls.start(p,id); }
    @GetMapping("/central/emergencies/{id}/voice-call")
    public Api.VoiceCallResponse current(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return calls.getForDispatcher(p,id); }
    @PostMapping("/central/voice-calls/{id}/offer")
    public Api.VoiceCallResponse offer(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id,@Valid @RequestBody Api.VoiceSdpRequest body) { return calls.offer(p,id,body.sdp()); }
    @GetMapping("/patient/voice-call")
    public ResponseEntity<Api.VoiceCallResponse> active(@AuthenticationPrincipal DemoPrincipal p) {
        return calls.activeForPatient(p).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }
    @PostMapping("/patient/voice-calls/{id}/answer")
    public Api.VoiceCallResponse answer(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id,@Valid @RequestBody Api.VoiceSdpRequest body) { return calls.answer(p,id,body.sdp()); }
    @PostMapping("/voice-calls/{id}/connected")
    public Api.VoiceCallResponse connected(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return calls.connected(p,id); }
    @PostMapping("/voice-calls/{id}/end")
    public Api.VoiceCallResponse end(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return calls.end(p,id,false); }
    @PostMapping("/patient/voice-calls/{id}/decline")
    public Api.VoiceCallResponse decline(@AuthenticationPrincipal DemoPrincipal p,@PathVariable UUID id) { return calls.end(p,id,true); }
}
