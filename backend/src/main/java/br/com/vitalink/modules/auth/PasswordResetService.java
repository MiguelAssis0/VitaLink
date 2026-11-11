package br.com.vitalink.modules.auth;

import br.com.vitalink.shared.errors.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class PasswordResetService {
    private static final Duration TOKEN_TTL=Duration.ofMinutes(30);
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwords;
    private final JavaMailSender mail;
    private final String appBaseUrl;
    private final String from;
    private final SecureRandom random=new SecureRandom();

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens, PasswordEncoder passwords,
            JavaMailSender mail, @Value("${APP_BASE_URL:http://localhost:5173}") String appBaseUrl,
            @Value("${MAIL_FROM:no-reply@vitalink.local}") String from) {
        this.users=users; this.tokens=tokens; this.passwords=passwords; this.mail=mail;
        this.appBaseUrl=appBaseUrl; this.from=from;
    }

    @Transactional
    public void request(String email) {
        users.findByEmailIgnoreCase(email.strip()).filter(user -> user.disabledAt==null).ifPresent(user -> {
            Instant now=Instant.now();
            tokens.invalidateUnused(user.id,now);
            byte[] bytes=new byte[32]; random.nextBytes(bytes);
            String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            var resetToken=new PasswordResetToken(user,hash(raw),now.plus(TOKEN_TTL),now);
            tokens.save(resetToken);
            var message=new SimpleMailMessage();
            message.setFrom(from); message.setTo(user.email); message.setSubject("Redefinição de senha do VitaLink");
            message.setText("Para redefinir sua senha, acesse este link em até 30 minutos:\n\n"+
                    appBaseUrl+"/reset-password#token="+raw+"\n\nSe você não solicitou a redefinição, ignore esta mensagem.");
            try { mail.send(message); }
            catch (MailException ignored) { resetToken.usedAt=now; }
        });
    }

    @Transactional
    public void confirm(String rawToken, String password) {
        Instant now=Instant.now();
        var token=tokens.findByTokenHash(hash(rawToken)).filter(t -> t.usedAt==null && t.expiresAt.isAfter(now))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,"INVALID_RESET_TOKEN","O link é inválido ou expirou. Solicite outro."));
        if (users.updatePasswordHash(token.user.getId(),passwords.encode(password))!=1)
            throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_RESET_TOKEN","O link é inválido ou expirou. Solicite outro.");
        token.usedAt=now;
        tokens.saveAndFlush(token);
        tokens.invalidateUnused(token.user.getId(),now);
    }

    private static String hash(String token) {
        try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
