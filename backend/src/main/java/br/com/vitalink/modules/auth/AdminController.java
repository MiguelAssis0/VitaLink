package br.com.vitalink.modules.auth;

import br.com.vitalink.modules.emergencies.EmergencyRepository;
import br.com.vitalink.modules.emergencies.EmergencyStatus;
import br.com.vitalink.modules.institutions.InstitutionRepository;
import br.com.vitalink.modules.patients.PrivacyRequestRepository;
import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.api.Api.PrivacyRequestType;
import br.com.vitalink.shared.domain.Role;
import br.com.vitalink.shared.errors.ApiException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.EnumSet;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final UserRepository users;
    private final InstitutionRepository institutions;
    private final EmergencyRepository emergencies;
    private final PrivacyRequestRepository privacyRequests;

    public AdminController(UserRepository users, InstitutionRepository institutions, EmergencyRepository emergencies,
                           PrivacyRequestRepository privacyRequests) {
        this.users = users;
        this.institutions = institutions;
        this.emergencies = emergencies;
        this.privacyRequests = privacyRequests;
    }

    @GetMapping("/overview")
    public Api.AdminOverview overview(@AuthenticationPrincipal DemoPrincipal principal) {
        if (principal == null || principal.user().role != Role.DEMO_ADMIN) throw ApiException.forbidden();
        var openStatuses = EnumSet.complementOf(EnumSet.of(EmergencyStatus.CLOSED, EmergencyStatus.CANCELLED));
        return new Api.AdminOverview(users.count(), institutions.count(), emergencies.count(),
            emergencies.countByStatusIn(openStatuses), privacyRequests.countByTypeAndStatus(PrivacyRequestType.DELETION, "PENDING"));
    }
}
