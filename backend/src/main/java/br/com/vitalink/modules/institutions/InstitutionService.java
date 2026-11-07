package br.com.vitalink.modules.institutions;

import br.com.vitalink.shared.errors.ApiException;

import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class InstitutionService {
    private final InstitutionRepository institutions;
    public InstitutionService(InstitutionRepository institutions) { this.institutions=institutions; }
    public Institution demoCentral() { return institutions.findById(Institution.DEMO_CENTRAL_ID).orElseThrow(ApiException::notFound); }
    public Institution demoHospital(UUID id) {
        return institutions.findById(id).filter(i -> i.kind.equals("HOSPITAL") && i.demo).orElseThrow(ApiException::notFound);
    }
}
