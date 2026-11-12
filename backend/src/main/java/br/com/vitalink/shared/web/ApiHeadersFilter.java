package br.com.vitalink.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import br.com.vitalink.modules.auth.SessionCookies;

@Component
public class ApiHeadersFilter extends OncePerRequestFilter {
    private final boolean secureCookies;

    public ApiHeadersFilter(@Value("${SESSION_COOKIE_SECURE:false}") boolean secureCookies) {
        this.secureCookies=secureCookies;
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        HttpSession session=request.getSession(false);
        if(session!=null && session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY) instanceof SecurityContext context
                && context.getAuthentication()!=null && context.getAuthentication().isAuthenticated()) {
            session.setMaxInactiveInterval(-1);
            SessionCookies.persist(response, session.getId(), secureCookies);
        }
        chain.doFilter(request,response);
    }
}
