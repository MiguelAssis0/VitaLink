ALTER TABLE ambulances
  ADD COLUMN latitude DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION;

ALTER TABLE institutions
  ADD COLUMN accepting_emergencies BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE emergencies
  ADD COLUMN ambulance_id UUID REFERENCES ambulances(id);

ALTER TABLE emergency_status_events
  ADD COLUMN automatic BOOLEAN NOT NULL DEFAULT FALSE;
