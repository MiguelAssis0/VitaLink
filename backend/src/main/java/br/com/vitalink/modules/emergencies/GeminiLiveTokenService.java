package br.com.vitalink.modules.emergencies;

import br.com.vitalink.shared.errors.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Service
public class GeminiLiveTokenService {
    private final String apiKey;
    private final String model;
    private final ObjectMapper mapper;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public GeminiLiveTokenService(@Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.live-model:gemini-3.8-live}") String model, ObjectMapper mapper) {
        this.apiKey=apiKey; this.model=model; this.mapper=mapper;
    }

    public String createToken() {
        if (apiKey.isBlank()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"GEMINI_NOT_CONFIGURED","Configure GEMINI_API_KEY no .env para iniciar a conversa de voz.");
        var function=Map.of("name","update_emergency_summary",
            "description","Atualize o resumo factual da ocorrência com informações novas que a pessoa acabou de falar. Não avalie gravidade nem recomende tratamento.",
            "parameters",Map.of("type","OBJECT","properties",Map.of("summary",Map.of("type","STRING","description","Resumo curto e factual em português para a equipe da simulação.")),"required",new String[]{"summary"}));
        var config=Map.of("responseModalities",new String[]{"AUDIO"},
            "systemInstruction",Map.of("parts",new Object[]{Map.of("text","Você é a atendente de voz do VitaLink, um protótipo de simulação. Fale em português do Brasil, com calma e frases curtas. Diga que esta conversa é simulada e que uma emergência real exige ligar 192. Colete apenas o que a pessoa relata e o local; não faça diagnóstico, não classifique gravidade e não recomende tratamento. Faça uma pergunta de cada vez. Assim que houver informação nova útil, chame update_emergency_summary com um resumo factual curto para a equipe. Nunca diga que uma equipe real foi acionada.")} ),
            "tools",new Object[]{Map.of("functionDeclarations",new Object[]{function})});
        var now=Instant.now();
        var payload=Map.of("uses",1,"expireTime",now.plusSeconds(1800).toString(),"newSessionExpireTime",now.plusSeconds(60).toString(),
            "liveConnectConstraints",Map.of("model","models/"+model,"config",config));
        try {
            var request=HttpRequest.newBuilder(URI.create("https://generativelanguage.googleapis.com/v1alpha/auth_tokens"))
                .timeout(Duration.ofSeconds(12)).header("Content-Type","application/json").header("x-goog-api-key",apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload))).build();
            var response=http.send(request,HttpResponse.BodyHandlers.ofString());
            var token=mapper.readTree(response.body()).path("name").asText();
            if(response.statusCode()<200 || response.statusCode()>=300 || token.isBlank()) throw new IllegalStateException("Gemini token provisioning failed");
            return token;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"GEMINI_UNAVAILABLE","Não foi possível iniciar a conversa de voz agora.");
        } catch (Exception e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"GEMINI_UNAVAILABLE","Não foi possível iniciar a conversa de voz agora.");
        }
    }

    public String model() { return model; }
}
