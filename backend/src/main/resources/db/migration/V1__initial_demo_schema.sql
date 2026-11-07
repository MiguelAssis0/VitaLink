CREATE TABLE institutions (
  id UUID PRIMARY KEY, name VARCHAR(120) NOT NULL, kind VARCHAR(30) NOT NULL, is_demo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE users (
  id UUID PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL,
  display_name VARCHAR(120) NOT NULL, role VARCHAR(30) NOT NULL, institution_id UUID REFERENCES institutions(id), disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE medical_profiles (
  patient_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allergies VARCHAR(1000) NOT NULL DEFAULT '', medications VARCHAR(1000) NOT NULL DEFAULT '',
  conditions VARCHAR(1000) NOT NULL DEFAULT '', notes VARCHAR(1000) NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE emergencies (
  id UUID PRIMARY KEY, patient_id UUID NOT NULL REFERENCES users(id), central_id UUID NOT NULL REFERENCES institutions(id),
  hospital_id UUID REFERENCES institutions(id), status VARCHAR(32) NOT NULL, is_simulation BOOLEAN NOT NULL DEFAULT TRUE,
  location_source VARCHAR(16) NOT NULL, manual_address VARCHAR(300) NOT NULL DEFAULT '', reference_point VARCHAR(200) NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, accuracy_meters DOUBLE PRECISION, notes VARCHAR(500) NOT NULL DEFAULT '',
  version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ
);
CREATE INDEX emergencies_central_status_created ON emergencies(central_id, status, created_at DESC);
CREATE INDEX emergencies_patient_created ON emergencies(patient_id, created_at DESC);
CREATE UNIQUE INDEX one_open_emergency_per_patient ON emergencies(patient_id) WHERE status NOT IN ('CLOSED','CANCELLED');
CREATE TABLE emergency_status_events (
  id UUID PRIMARY KEY, emergency_id UUID NOT NULL REFERENCES emergencies(id), old_status VARCHAR(32), new_status VARCHAR(32) NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE access_grants (
  id UUID PRIMARY KEY, emergency_id UUID NOT NULL REFERENCES emergencies(id), institution_id UUID NOT NULL REFERENCES institutions(id),
  granted_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX access_grants_active_unique ON access_grants(emergency_id, institution_id) WHERE revoked_at IS NULL;
CREATE TABLE audit_events (
  id UUID PRIMARY KEY, actor_id UUID NOT NULL REFERENCES users(id), institution_id UUID REFERENCES institutions(id),
  action VARCHAR(80) NOT NULL, object_type VARCHAR(40) NOT NULL, object_id UUID, result VARCHAR(24) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(), correlation_id UUID
);
CREATE INDEX audit_events_object_time ON audit_events(object_type, object_id, occurred_at DESC);
CREATE TABLE idempotency_records (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), key_hash CHAR(64) NOT NULL, request_hash CHAR(64) NOT NULL,
  emergency_id UUID NOT NULL REFERENCES emergencies(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key_hash)
);
