ALTER TABLE users ADD COLUMN phone VARCHAR(30) NOT NULL DEFAULT '';

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  relationship VARCHAR(80) NOT NULL DEFAULT ''
);
CREATE INDEX emergency_contacts_patient ON emergency_contacts(patient_id);

CREATE TABLE privacy_requests (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('EXPORT','DELETION')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('COMPLETED','PENDING')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX privacy_requests_patient_created ON privacy_requests(patient_id, created_at DESC);
