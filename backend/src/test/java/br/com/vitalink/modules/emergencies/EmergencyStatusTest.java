package br.com.vitalink.modules.emergencies;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EmergencyStatusTest {
    @Test void followsOnlySimulationTransitionsAndCentralMustConfirmCancellation() {
        assertTrue(EmergencyStatus.REQUESTED.canTransitionTo(EmergencyStatus.ACKNOWLEDGED));
        assertFalse(EmergencyStatus.REQUESTED.canTransitionTo(EmergencyStatus.EN_ROUTE));
        assertTrue(EmergencyStatus.ON_SCENE.canTransitionTo(EmergencyStatus.CLOSED));
        assertTrue(EmergencyStatus.EN_ROUTE.canTransitionTo(EmergencyStatus.CANCEL_REQUESTED));
        assertFalse(EmergencyStatus.EN_ROUTE.canTransitionTo(EmergencyStatus.CANCELLED));
        assertTrue(EmergencyStatus.CANCEL_REQUESTED.canTransitionTo(EmergencyStatus.CANCELLED));
        assertFalse(EmergencyStatus.CLOSED.canTransitionTo(EmergencyStatus.REQUESTED));
    }
}
