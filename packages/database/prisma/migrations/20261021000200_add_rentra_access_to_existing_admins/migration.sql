-- Let existing admin accounts use Rentra's tenant features with the same user ID.
-- Keep the ADMIN role and any other capabilities intact.
UPDATE "User"
SET "roles" = array_append("roles", 'TENANT'::"Role")
WHERE 'ADMIN'::"Role" = ANY("roles")
  AND NOT ('TENANT'::"Role" = ANY("roles"));
