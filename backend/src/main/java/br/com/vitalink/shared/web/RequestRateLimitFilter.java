package br.com.vitalink.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RequestRateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_MS=60_000;
    private final ConcurrentHashMap<String, Window> windows=new ConcurrentHashMap<>();
    private final Clock clock=Clock.systemUTC();
    // shortcut: local in-memory per-IP windows; replace with a shared proxy-aware limiter before multi-instance deployment.

    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String path=request.getRequestURI();
        int limit=limit(path,request.getMethod());
        if(limit>0) {
            long now=clock.millis(); String key=request.getRemoteAddr()+":"+path;
            if(!windows.computeIfAbsent(key,k -> new Window(now)).allow(now,limit)) {
                response.setStatus(429); response.setContentType("application/problem+json"); response.setHeader("Retry-After","60");
                response.setHeader("Cache-Control","no-store"); response.setHeader("X-Content-Type-Options","nosniff"); response.setHeader("X-Frame-Options","DENY"); response.setHeader("Referrer-Policy","no-referrer");
                response.getWriter().write("{\"code\":\"RATE_LIMITED\",\"title\":\"Too Many Requests\",\"detail\":\"Tente novamente em instantes.\"}"); return;
            }
            if(windows.size()>10_000) windows.entrySet().removeIf(e -> now-e.getValue().startedAt()>WINDOW_MS);
        }
        chain.doFilter(request,response);
    }
    private static int limit(String path,String method) {
        if(!"POST".equals(method)) return 0;
        if(path.equals("/api/v1/auth/login")) return 10;
        if(path.equals("/api/v1/auth/register")) return 5;
        if(path.equals("/api/v1/auth/password-reset/request")) return 5;
        if(path.equals("/api/v1/auth/password-reset/confirm")) return 10;
        if(path.equals("/api/v1/emergencies")) return 5;
        if(path.equals("/api/v1/patients/me/privacy-requests")) return 5;
        return 0;
    }
    static final class Window {
        private long started; private int count;
        Window(long started) { this.started=started; }
        synchronized boolean allow(long now,int limit) {
            if(now-started>=WINDOW_MS || now<started) { started=now; count=0; }
            return ++count<=limit;
        }
        synchronized long startedAt() { return started; }
    }
}
