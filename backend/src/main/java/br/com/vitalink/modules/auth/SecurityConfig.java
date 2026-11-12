package br.com.vitalink.modules.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.ObjectPostProcessor;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.authentication.HttpMessageConverterAuthenticationSuccessHandler;
import org.springframework.security.web.webauthn.authentication.WebAuthnAuthenticationFilter;
import org.springframework.security.web.webauthn.api.AuthenticatorSelectionCriteria;
import org.springframework.security.web.webauthn.api.PublicKeyCredentialRpEntity;
import org.springframework.security.web.webauthn.api.ResidentKeyRequirement;
import org.springframework.security.web.webauthn.api.UserVerificationRequirement;
import org.springframework.security.web.webauthn.management.JdbcPublicKeyCredentialUserEntityRepository;
import org.springframework.security.web.webauthn.management.JdbcUserCredentialRepository;
import org.springframework.security.web.webauthn.management.PublicKeyCredentialUserEntityRepository;
import org.springframework.security.web.webauthn.management.UserCredentialRepository;
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations;
import org.springframework.security.web.webauthn.management.Webauthn4JRelyingPartyOperations;
import java.net.URI;
import java.util.Set;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean UserDetailsService userDetailsService(UserRepository users) {
        return email -> users.findByEmailIgnoreCase(email).filter(u -> u.disabledAt == null)
                .map(DemoPrincipal::new).orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Invalid credentials"));
    }
    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception { return config.getAuthenticationManager(); }
    @Bean SecurityContextRepository securityContextRepository() { return new HttpSessionSecurityContextRepository(); }
    @Bean JdbcPublicKeyCredentialUserEntityRepository passkeyUsers(JdbcOperations jdbc) { return new JdbcPublicKeyCredentialUserEntityRepository(jdbc); }
    @Bean JdbcUserCredentialRepository passkeyCredentials(JdbcOperations jdbc) { return new JdbcUserCredentialRepository(jdbc); }

    @Bean WebAuthnRelyingPartyOperations passkeyOperations(PublicKeyCredentialUserEntityRepository users, UserCredentialRepository credentials,
            @Value("${webauthn.rp-id}") String rpId, @Value("${webauthn.allowed-origin}") String allowedOrigin) {
        URI origin=URI.create(allowedOrigin);
        if(origin.getHost()==null || !origin.getHost().equalsIgnoreCase(rpId) || origin.getUserInfo()!=null || origin.getQuery()!=null || origin.getFragment()!=null
                || (origin.getPath()!=null && !origin.getPath().isEmpty()) || (!"https".equals(origin.getScheme()) && !"localhost".equalsIgnoreCase(rpId) && !"127.0.0.1".equals(rpId)))
            throw new IllegalArgumentException("WebAuthn origin must be one exact HTTPS origin matching the configured RP ID");
        var operations=new Webauthn4JRelyingPartyOperations(users, credentials,
                PublicKeyCredentialRpEntity.builder().id(rpId).name("VitaLink").build(), Set.of(allowedOrigin));
        operations.setCustomizeCreationOptions(options -> options.authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                .residentKey(ResidentKeyRequirement.REQUIRED).userVerification(UserVerificationRequirement.REQUIRED).build()));
        operations.setCustomizeRequestOptions(options -> options.userVerification(UserVerificationRequirement.REQUIRED));
        return operations;
    }

    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository contextRepository,
                                                   @Value("${SESSION_COOKIE_SECURE:false}") boolean secureCookies,
                                                   @Value("${webauthn.rp-id}") String rpId,
                                                   @Value("${webauthn.allowed-origin}") String allowedOrigin) throws Exception {
        var csrfRepo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepo.setCookiePath("/");
        csrfRepo.setCookieCustomizer(cookie -> cookie.sameSite("Lax").secure(secureCookies));
        var csrfHandler = new CsrfTokenRequestAttributeHandler();
        http
            .csrf(csrf -> csrf.csrfTokenRepository(csrfRepo).csrfTokenRequestHandler(csrfHandler))
            .headers(headers -> headers
                .contentTypeOptions(Customizer.withDefaults())
                .frameOptions(frame -> frame.deny())
                .referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")))
            .securityContext(c -> c.securityContextRepository(contextRepository))
            .sessionManagement(s -> s.sessionFixation(f -> f.migrateSession()))
            .authorizeHttpRequests(a -> a.requestMatchers("/api/v1/auth/csrf", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/password-reset/**", "/webauthn/authenticate/options", "/login/webauthn", "/actuator/health", "/error").permitAll().anyRequest().authenticated())
            .formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .exceptionHandling(e -> e.authenticationEntryPoint((request, response, ex) -> {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/problem+json");
                response.getWriter().write("{\"code\":\"UNAUTHORIZED\",\"title\":\"Unauthorized\",\"detail\":\"Autenticação necessária.\"}");
            }))
            .webAuthn(webAuthn -> webAuthn
                .rpName("VitaLink")
                .rpId(rpId)
                .allowedOrigins(allowedOrigin)
                .disableDefaultRegistrationPage(true)
                .withObjectPostProcessor(new ObjectPostProcessor<WebAuthnAuthenticationFilter>() {
                    @Override public WebAuthnAuthenticationFilter postProcess(WebAuthnAuthenticationFilter filter) {
                        var successHandler=new HttpMessageConverterAuthenticationSuccessHandler();
                        filter.setAuthenticationSuccessHandler((request,response,authentication) -> {
                            var session=request.getSession(false);
                            if(session!=null) {
                                session.setMaxInactiveInterval(-1);
                                SessionCookies.persist(response,session.getId(),secureCookies);
                            }
                            successHandler.onAuthenticationSuccess(request,response,authentication);
                        });
                        return filter;
                    }
                }));
        return http.build();
    }
}
