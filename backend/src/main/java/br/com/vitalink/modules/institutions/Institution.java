package br.com.vitalink.modules.institutions;

import jakarta.persistence.*;
import java.util.UUID;

@Entity @Table(name="institutions")
public class Institution {
    public static final UUID DEMO_CENTRAL_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    public static final UUID DEMO_HOSPITAL_ID = UUID.fromString("10000000-0000-4000-8000-000000000002");
    @Id public UUID id;
    public String name;
    public String kind;
    @Column(name="is_demo") public boolean demo = true;
    protected Institution() {}
    public Institution(UUID id, String name, String kind) { this.id=id; this.name=name; this.kind=kind; }
    public UUID getId() { return id; }
    public String getName() { return name; }
}
