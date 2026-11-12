package br.com.vitalink.modules.patients;

import br.com.vitalink.modules.emergencies.EmergencyRegisteredEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

@Component
public class ZenviaEmergencySmsListener {
    private static final Logger log = LoggerFactory.getLogger(ZenviaEmergencySmsListener.class);
    private final EmergencyContactRepository contacts;
    private final RestClient client;
    private final String apiToken;
    private final String sender;
    private final boolean enabled;

    public ZenviaEmergencySmsListener(EmergencyContactRepository contacts,
            @Value("${notifications.zenvia.sms.enabled:false}") boolean enabled,
            @Value("${notifications.zenvia.sms.api-token:}") String apiToken,
            @Value("${notifications.zenvia.sms.sender:}") String sender) {
        this.contacts = contacts;
        this.enabled = enabled;
        this.apiToken = apiToken;
        this.sender = sender;
        var requestFactory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(3));
        this.client = RestClient.builder().baseUrl("https://api.zenvia.com")
                .requestFactory(requestFactory).build();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmergencyRegistered(EmergencyRegisteredEvent event) {
        if (!enabled) return;
        if (apiToken.isBlank() || sender.isBlank()) {
            log.warn("SMS de ajuda não configurado; nenhum envio feito para solicitação {}", event.emergencyId());
            return;
        }
        var message = message(event);
        if (message == null) {
            log.warn("SMS de ajuda ignorado para solicitação {} sem localização", event.emergencyId());
            return;
        }

        for (var contact : contacts.findByPatientIdAndSmsOptInTrueOrderByNameAsc(event.patientId())) {
            var phone = normalizeBrazilianPhone(contact.phone);
            if (phone == null) {
                log.warn("SMS de ajuda ignorado para contato {} com telefone inválido", contact.id);
                continue;
            }
            try {
                client.post().uri("/v2/channels/sms/messages")
                        .header("X-API-TOKEN", apiToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ZenviaMessage(sender, phone, List.of(new ZenviaText("text", message))))
                        .retrieve().toBodilessEntity();
            } catch (RestClientException | IllegalArgumentException failure) {
                log.warn("Zenvia não aceitou SMS para contato {} na solicitação {} ({})",
                        contact.id, event.emergencyId(), failure.getClass().getSimpleName());
            }
        }
    }

    static String normalizeBrazilianPhone(String phone) {
        if (phone == null) return null;
        var digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("55") && (digits.length() == 12 || digits.length() == 13)) return "+" + digits;
        if (digits.length() == 10 || digits.length() == 11) return "+55" + digits;
        if (digits.startsWith("0") && (digits.length() == 11 || digits.length() == 12)) return "+55" + digits.substring(1);
        if (digits.startsWith("0") && (digits.length() == 13 || digits.length() == 14)) return "+55" + digits.substring(3);
        return null;
    }

    private static String message(EmergencyRegisteredEvent event) {
        var location = new StringBuilder();
        if (event.address() != null && !event.address().isBlank()) location.append("Endereço: ").append(event.address().strip());
        if (event.latitude() != null && event.longitude() != null) {
            if (!location.isEmpty()) location.append('\n');
            location.append("Mapa: https://maps.google.com/?q=").append(event.latitude()).append(',').append(event.longitude());
        }
        if (location.isEmpty()) return null;
        return "Pedido de ajuda no VitaLink.\n" + location + "\nEntre em contato com a pessoa se puder ajudar.";
    }

    private record ZenviaMessage(String from, String to, List<ZenviaText> contents) { }
    private record ZenviaText(String type, String text) { }
}
