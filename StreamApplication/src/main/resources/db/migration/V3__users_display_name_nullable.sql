-- Make display_name nullable so user registration works without it
ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;
