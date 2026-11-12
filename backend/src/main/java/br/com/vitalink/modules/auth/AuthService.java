package br.com.vitalink.modules.auth;

import br.com.vitalink.shared.api.Api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final boolean secureCookies;
    public AuthService(AuthenticationManager authenticationManager, SecurityContextRepository contextRepository,
                       UserRepository users, PasswordEncoder passwordEncoder,
                       @Value("${SESSION_COOKIE_SECURE:false}") boolean secureCookies) {
        this.authenticationManager=authenticationManager; this.contextRepository=contextRepository;
        this.users=users; this.passwordEncoder=passwordEncoder; this.secureCookies=secureCookies;
    }
    @Transactional
    public Api.RegistrationResponse register(Api.RegisterRequest body) {
        var email=body.email().strip().toLowerCase(Locale.ROOT);
        if(!users.existsByEmailIgnoreCase(email)) {
            var user=new AppUser(); user.id=UUID.randomUUID(); user.email=email;
            user.displayName=body.displayName().strip(); user.passwordHash=passwordEncoder.encode(body.password()); user.role=br.com.vitalink.shared.domain.Role.PATIENT;
            users.save(user);
        }
        return new Api.RegistrationResponse("Se a conta estiver disponível, entre com os dados informados. O cadastro não envia confirmação por e-mail.");
    }
    public Api.UserResponse login(Api.LoginRequest body,HttpServletRequest request,HttpServletResponse response) {
        var authentication=authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(body.email(),body.password()));
        var session=request.getSession(true);
        request.changeSessionId();
        session.setMaxInactiveInterval(-1);
        var context=SecurityContextHolder.createEmptyContext(); context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context); contextRepository.saveContext(context,request,response);
        SessionCookies.persist(response, session.getId(), secureCookies);
        return response((DemoPrincipal)authentication.getPrincipal());
    }
    public void logout(HttpServletRequest request,HttpServletResponse response) {
        var session=request.getSession(false); if(session!=null) session.invalidate();
        SecurityContextHolder.clearContext();
        SessionCookies.expire(response, secureCookies);
    }
    public Api.UserResponse current(DemoPrincipal principal) { return response(principal); }
    private static Api.UserResponse response(DemoPrincipal p) {
        var u=p.user(); return new Api.UserResponse(u.id,u.displayName,u.email,u.role,u.institution==null?null:u.institution.name);
    }
}
