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
    public AuthController(AuthService service) { this.service=service; }
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) { return Map.of("headerName",token.getHeaderName(),"token",token.getToken()); }
    @PostMapping("/register") @ResponseStatus(HttpStatus.ACCEPTED)
    public Api.RegistrationResponse register(@Valid @RequestBody Api.RegisterRequest body) { return service.register(body); }
    @PostMapping("/login") public Api.UserResponse login(@Valid @RequestBody Api.LoginRequest body,HttpServletRequest request,HttpServletResponse response) { return service.login(body,request,response); }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request,HttpServletResponse response) { service.logout(request,response); }
    @GetMapping("/me") public Api.UserResponse me(@AuthenticationPrincipal DemoPrincipal principal) { return service.current(principal); }
}
