package br.com.vitalink.modules.emergencies;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.vitalink.modules.auth.DemoPrincipal;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;

@RestController
@RequestMapping("/api/v1/ai")
public class GeminiLiveTokenController {
    private final GeminiLiveTokenService tokens;

    public GeminiLiveTokenController(GeminiLiveTokenService tokens) {
        this.tokens = tokens;
    }

    @PostMapping("/live-token")
    public Api.LiveTokenResponse create(@AuthenticationPrincipal DemoPrincipal principal) {
        if (principal == null || principal.user().role != Role.PATIENT)
            throw ApiException.forbidden();
        return new Api.LiveTokenResponse(tokens.createToken(), tokens.model());
    }
}
