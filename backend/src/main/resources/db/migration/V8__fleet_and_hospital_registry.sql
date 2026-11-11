CREATE TABLE ambulances (
  id UUID PRIMARY KEY,
  central_id UUID NOT NULL REFERENCES institutions(id),
  code VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL CHECK (status IN ('AVAILABLE','OCCUPIED','OUT_OF_SERVICE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (central_id, code)
);

CREATE TABLE hospital_ambulance_crew (
  id UUID PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES institutions(id),
  name VARCHAR(120) NOT NULL,
  position VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX hospital_ambulance_crew_hospital_name ON hospital_ambulance_crew(hospital_id, name);

CREATE TABLE hospital_patients (
  id UUID PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES institutions(id),
  name VARCHAR(120) NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX hospital_patients_hospital_created ON hospital_patients(hospital_id, created_at DESC);
