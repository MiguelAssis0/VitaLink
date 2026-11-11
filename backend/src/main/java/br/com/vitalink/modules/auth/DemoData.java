package br.com.vitalink.modules.auth;

import br.com.vitalink.modules.institutions.Institution;
import br.com.vitalink.modules.institutions.InstitutionRepository;
import br.com.vitalink.modules.emergencies.AccessGrant;
import br.com.vitalink.modules.emergencies.AccessGrantRepository;
import br.com.vitalink.modules.emergencies.Emergency;
import br.com.vitalink.modules.emergencies.EmergencyRepository;
import br.com.vitalink.modules.emergencies.EmergencyStatus;
import br.com.vitalink.modules.emergencies.StatusEvent;
import br.com.vitalink.modules.emergencies.StatusEventRepository;
import br.com.vitalink.modules.patients.MedicalProfile;
import br.com.vitalink.modules.patients.MedicalProfileRepository;
import br.com.vitalink.shared.domain.Role;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.UUID;
import java.time.Instant;

@Configuration
public class DemoData {
    public static final UUID PATIENT_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private record DemoCase(String name, EmergencyStatus status, String condition, String notes) {}
    @Bean ApplicationRunner seedDemo(UserRepository users, InstitutionRepository institutions, MedicalProfileRepository profiles,
                                      EmergencyRepository emergencies, AccessGrantRepository grants, StatusEventRepository events,
                                      PasswordEncoder encoder, @Value("${app.demo-mode:true}") boolean demoMode) {
        return args -> {
            if (!demoMode) throw new IllegalStateException("VitaLink supports DEMO_MODE=true only; real emergency dispatch is not implemented.");
            if (users.count() == 0) {
                var central = institutions.save(new Institution(Institution.DEMO_CENTRAL_ID, "Central Fictícia VitaLink", "CENTRAL"));
                var hospital = institutions.save(new Institution(Institution.DEMO_HOSPITAL_ID, "Hospital Fictício VitaLink", "HOSPITAL"));
                var patient = user(PATIENT_ID, "patient@vitalink.local", "Paciente de Demonstração", Role.PATIENT, null, encoder);
                users.save(patient);
                users.save(user(UUID.randomUUID(), "dispatcher@vitalink.local", "Operador de Demonstração", Role.DISPATCHER, central, encoder));
                users.save(user(UUID.randomUUID(), "hospital@vitalink.local", "Profissional de Demonstração", Role.HOSPITAL_STAFF, hospital, encoder));
                users.save(user(UUID.randomUUID(), "admin@vitalink.local", "Administrador de Demonstração", Role.DEMO_ADMIN, null, encoder));
                var profile = new MedicalProfile(patient.id);
                profile.allergies = "Exemplo sintético: nenhuma alergia informada";
                profile.medications = "Exemplo sintético: nenhum medicamento informado";
                profile.conditions = "Cenário fictício de demonstração";
                profiles.save(profile);
            }
            seedHospitalCases(users, institutions, profiles, emergencies, grants, events, encoder);
        };
    }

    private static void seedHospitalCases(UserRepository users, InstitutionRepository institutions, MedicalProfileRepository profiles,
                                          EmergencyRepository emergencies, AccessGrantRepository grants, StatusEventRepository events,
                                          PasswordEncoder encoder) {
        var central = institutions.findById(Institution.DEMO_CENTRAL_ID).orElseThrow();
        var hospital = institutions.findById(Institution.DEMO_HOSPITAL_ID).orElseThrow();
        var dispatcher = users.findByEmailIgnoreCase("dispatcher@vitalink.local").orElseThrow();
        var scenarios = java.util.List.of(
            new DemoCase("Marina Costa", EmergencyStatus.ACKNOWLEDGED, "Dor no peito", "Exemplo sintético para demonstração."),
            new DemoCase("Rafael Lima", EmergencyStatus.EN_ROUTE, "Queda sem perda de consciência", "Cenário fictício. Sem dados de pessoa real."),
            new DemoCase("Joana Martins", EmergencyStatus.ON_SCENE, "Mal-estar", "Informação clínica sintética de demonstração.")
        );
        for (int i = 0; i < scenarios.size(); i++) {
            var scenario = scenarios.get(i);
            var index = i + 1;
            var id = UUID.fromString("30000000-0000-4000-8000-" + String.format("%012d", index));
            if (emergencies.existsById(id)) continue;
            var patientId = UUID.fromString("40000000-0000-4000-8000-" + String.format("%012d", index));
            var patient = users.findById(patientId).orElseGet(() -> users.save(user(patientId,
                "mock" + index + "@vitalink.local", scenario.name(), Role.PATIENT, null, encoder)));
            var profile = profiles.findById(patientId).orElseGet(() -> new MedicalProfile(patientId));
            profile.allergies = "Nenhuma informada (dado sintético)";
            profile.medications = "Não informado (dado sintético)";
            profile.conditions = scenario.condition();
            profile.notes = scenario.notes();
            profiles.save(profile);
            var emergency = new Emergency();
            emergency.id = id; emergency.patient = patient; emergency.central = central; emergency.hospital = hospital;
            emergency.status = scenario.status(); emergency.locationSource = "MANUAL";
            emergency.address = "Endereço fictício — Setor " + (char) ('A' + i);
            emergency.referencePoint = "Local demonstrativo"; emergency.notes = scenario.condition();
            emergency.createdAt = Instant.now().minusSeconds(index * 3600L);
            emergencies.save(emergency);
            grants.save(new AccessGrant(emergency, hospital, dispatcher, null));
            events.save(new StatusEvent(emergency, EmergencyStatus.REQUESTED.name(), emergency.status.name(), dispatcher));
        }
    }
    private static AppUser user(UUID id, String email, String name, Role role, Institution institution, PasswordEncoder encoder) {
        var u = new AppUser(); u.id=id; u.email=email; u.displayName=name; u.passwordHash=encoder.encode("Demo1234!"); u.role=role; u.institution=institution; return u;
    }
}
