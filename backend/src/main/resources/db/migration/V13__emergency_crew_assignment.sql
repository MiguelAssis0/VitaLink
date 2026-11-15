ALTER TABLE hospital_ambulance_crew
  ADD COLUMN available BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE emergency_ambulance_crew (
  emergency_id UUID NOT NULL REFERENCES emergencies(id),
  crew_member_id UUID NOT NULL REFERENCES hospital_ambulance_crew(id),
  PRIMARY KEY (emergency_id, crew_member_id)
);
