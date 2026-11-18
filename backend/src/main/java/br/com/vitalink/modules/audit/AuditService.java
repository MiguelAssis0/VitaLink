package br.com.vitalink.modules.audit;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.vitalink.modules.auth.AppUser;

@Service
public class AuditService {
    private final AuditEventRepository events;

    public AuditService(AuditEventRepository events) {
        this.events = events;
    }

    @Transactional
    public void record(AppUser actor, String action, String objectType, UUID objectId) {
        events.save(new AuditEvent(actor, action, objectType, objectId));
    }
}
