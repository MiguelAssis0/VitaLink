package br.com.vitalink.modules.emergencies;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EmergencyStatusTest {
    @Test
    void followsOnlySimulationTransitionsAndCentralMustConfirmCancellation() {
        assertTrue(EmergencyStatus.REQUESTED.canTransitionTo(EmergencyStatus.ACKNOWLEDGED));
        assertFalse(EmergencyStatus.REQUESTED.canTransitionTo(EmergencyStatus.EN_ROUTE));
        assertTrue(EmergencyStatus.ON_SCENE.canTransitionTo(EmergencyStatus.CLOSED));
        assertTrue(EmergencyStatus.EN_ROUTE.canTransitionTo(EmergencyStatus.CANCEL_REQUESTED));
        assertFalse(EmergencyStatus.EN_ROUTE.canTransitionTo(EmergencyStatus.CANCELLED));
        assertTrue(EmergencyStatus.CANCEL_REQUESTED.canTransitionTo(EmergencyStatus.CANCELLED));
        assertFalse(EmergencyStatus.CLOSED.canTransitionTo(EmergencyStatus.REQUESTED));
    }
}
