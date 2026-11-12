package br.com.vitalink.modules.auth;

import br.com.vitalink.shared.api.Api;
import br.com.vitalink.shared.domain.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    @Test void registrationCreatesOnlyAdultPatientWithHashedPassword() {
        var users=mock(UserRepository.class); var encoder=mock(PasswordEncoder.class);
        when(users.existsByEmailIgnoreCase("patient@example.test")).thenReturn(false);
        when(encoder.encode("StrongPass1!")).thenReturn("hashed-password");
        var service=new AuthService(mock(AuthenticationManager.class),mock(SecurityContextRepository.class),users,encoder,false);

        var response=service.register(new Api.RegisterRequest(" Synthetic Patient ","Patient@Example.Test","StrongPass1!",true));

        var captor=org.mockito.ArgumentCaptor.forClass(AppUser.class);
        verify(users).save(captor.capture());
        assertEquals("patient@example.test",captor.getValue().email);
        assertEquals("Synthetic Patient",captor.getValue().displayName);
        assertEquals(Role.PATIENT,captor.getValue().role);
        assertEquals("hashed-password",captor.getValue().passwordHash);
        assertTrue(response.message().contains("não envia confirmação por e-mail"));
    }

    @Test void duplicateEmailReturnsSameGenericResponseWithoutCreatingAccount() {
        var users=mock(UserRepository.class); var encoder=mock(PasswordEncoder.class);
        when(users.existsByEmailIgnoreCase("patient@example.test")).thenReturn(true);
        var service=new AuthService(mock(AuthenticationManager.class),mock(SecurityContextRepository.class),users,encoder,false);

        var response=service.register(new Api.RegisterRequest("Patient","patient@example.test","StrongPass1!",true));

        verify(users,never()).save(any());
        assertTrue(response.message().startsWith("Se a conta estiver disponível"));
    }
}
