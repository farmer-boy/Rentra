-- Existing landlord accounts retain the same user ID and gain tenant capabilities.
-- Keep any additional roles (including ADMIN) unchanged.
UPDATE "User"
SET "roles" = array_append("roles", 'TENANT'::"Role")
WHERE 'LANDLORD'::"Role" = ANY("roles")
  AND NOT ('TENANT'::"Role" = ANY("roles"));
