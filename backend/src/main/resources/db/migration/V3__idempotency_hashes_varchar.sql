ALTER TABLE idempotency_records ALTER COLUMN key_hash TYPE VARCHAR(64);
ALTER TABLE idempotency_records ALTER COLUMN request_hash TYPE VARCHAR(64);
