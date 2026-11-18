package br.com.vitalink.shared.web;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RequestRateLimitFilterTest {
    @Test
    void allowsConfiguredRequestsThenResetsAfterWindow() {
        var window = new RequestRateLimitFilter.Window(1_000);
        assertTrue(window.allow(1_000, 2));
        assertTrue(window.allow(1_001, 2));
        assertFalse(window.allow(1_002, 2));
        assertTrue(window.allow(61_000, 2));
    }
}
