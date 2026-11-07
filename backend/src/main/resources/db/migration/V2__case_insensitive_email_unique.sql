CREATE UNIQUE INDEX users_email_case_insensitive ON users (lower(email));
