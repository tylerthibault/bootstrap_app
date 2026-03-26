BEGIN;

INSERT INTO roles (name)
SELECT 'user'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'user'
);

INSERT INTO roles (name)
SELECT 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'admin'
);

COMMIT;
