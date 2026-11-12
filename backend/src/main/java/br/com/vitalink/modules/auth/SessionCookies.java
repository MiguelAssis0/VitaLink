package br.com.vitalink.modules.auth;

import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;

public final class SessionCookies {
    private static final int MAX_AGE = Integer.MAX_VALUE;

    private SessionCookies() {}

    public static void persist(HttpServletResponse response, String sessionId, boolean secure) {
        replace(response, "JSESSIONID="+sessionId+"; Path=/; Max-Age="+MAX_AGE+"; HttpOnly; SameSite=Lax"+(secure?"; Secure":""));
    }

    public static void expire(HttpServletResponse response, boolean secure) {
        replace(response, "JSESSIONID=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"+(secure?"; Secure":""));
    }

    private static void replace(HttpServletResponse response, String sessionCookie) {
        var otherCookies=new ArrayList<>(response.getHeaders("Set-Cookie"));
        otherCookies.removeIf(cookie -> cookie.regionMatches(true, 0, "JSESSIONID=", 0, 11));
        response.setHeader("Set-Cookie", sessionCookie);
        otherCookies.forEach(cookie -> response.addHeader("Set-Cookie", cookie));
    }
}
