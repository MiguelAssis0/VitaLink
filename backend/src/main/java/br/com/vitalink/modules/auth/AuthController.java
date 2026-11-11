package br.com.vitalink.modules.auth;

import br.com.vitalink.shared.api.Api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service;
    private final PasswordResetService passwordReset;
    public AuthController(AuthService service, PasswordResetService passwordReset) { this.service=service; this.passwordReset=passwordReset; }
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) { return Map.of("headerName",token.getHeaderName(),"token",token.getToken()); }
    @PostMapping("/register") @ResponseStatus(HttpStatus.ACCEPTED)
    public Api.RegistrationResponse register(@Valid @RequestBody Api.RegisterRequest body) { return service.register(body); }
    @PostMapping("/login") public Api.UserResponse login(@Valid @RequestBody Api.LoginRequest body,HttpServletRequest request,HttpServletResponse response) { return service.login(body,request,response); }
    @PostMapping("/password-reset/request") @ResponseStatus(HttpStatus.ACCEPTED)
    public Api.RegistrationResponse requestPasswordReset(@Valid @RequestBody Api.PasswordResetRequest body) {
        passwordReset.request(body.email());
        return new Api.RegistrationResponse("Se houver uma conta com este email, enviaremos um link para redefinir a senha.");
    }
    @PostMapping("/password-reset/confirm") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmPasswordReset(@Valid @RequestBody Api.PasswordResetConfirmRequest body) { passwordReset.confirm(body.token(),body.password()); }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request,HttpServletResponse response) { service.logout(request,response); }
    @GetMapping("/me") public Api.UserResponse me(@AuthenticationPrincipal DemoPrincipal principal) { return service.current(principal); }
}
