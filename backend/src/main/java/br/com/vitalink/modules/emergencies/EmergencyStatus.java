package br.com.vitalink.modules.emergencies;

import java.util.Set;

public enum EmergencyStatus {
    REQUESTED, ACKNOWLEDGED, RESOURCE_ASSIGNED, EN_ROUTE, ON_SCENE, CLOSED, CANCEL_REQUESTED, CANCELLED;

    public boolean open() { return this != CLOSED && this != CANCELLED; }
    public boolean canTransitionTo(EmergencyStatus next) {
        if (this == CANCEL_REQUESTED) return next == CANCELLED;
        if (!open()) return false;
        return switch (this) {
            case REQUESTED -> Set.of(ACKNOWLEDGED, CANCEL_REQUESTED).contains(next);
            case ACKNOWLEDGED -> Set.of(RESOURCE_ASSIGNED, EN_ROUTE, CANCEL_REQUESTED).contains(next);
            case RESOURCE_ASSIGNED -> Set.of(EN_ROUTE, CANCEL_REQUESTED).contains(next);
            case EN_ROUTE -> Set.of(ON_SCENE, CANCEL_REQUESTED).contains(next);
            case ON_SCENE -> Set.of(CLOSED, CANCEL_REQUESTED).contains(next);
            default -> false;
        };
    }
}
