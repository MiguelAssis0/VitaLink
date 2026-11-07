package br.com.vitalink.modules.auth;

import br.com.vitalink.modules.institutions.Institution;
import br.com.vitalink.modules.institutions.InstitutionRepository;
import br.com.vitalink.modules.patients.MedicalProfile;
import br.com.vitalink.modules.patients.MedicalProfileRepository;
import br.com.vitalink.shared.domain.Role;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Configuration
public class DemoData {
    public static final UUID PATIENT_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");
    @Bean ApplicationRunner seedDemo(UserRepository users, InstitutionRepository institutions, MedicalProfileRepository profiles,
                                      PasswordEncoder encoder, @Value("${app.demo-mode:true}") boolean demoMode) {
        return args -> {
            if (!demoMode) throw new IllegalStateException("VitaLink supports DEMO_MODE=true only; real emergency dispatch is not implemented.");
            if (users.count() > 0) return;
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
        };
    }
    private static AppUser user(UUID id, String email, String name, Role role, Institution institution, PasswordEncoder encoder) {
        var u = new AppUser(); u.id=id; u.email=email; u.displayName=name; u.passwordHash=encoder.encode("Demo1234!"); u.role=role; u.institution=institution; return u;
    }
}
