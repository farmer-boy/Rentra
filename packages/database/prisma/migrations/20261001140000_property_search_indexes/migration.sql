CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Property_status_createdAt_idx"
  ON "Property"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Property_status_price_idx"
  ON "Property"("status", "price");
CREATE INDEX IF NOT EXISTS "Property_status_bedrooms_bathrooms_idx"
  ON "Property"("status", "bedrooms", "bathrooms");
CREATE INDEX IF NOT EXISTS "Property_status_rentalMode_furnishedStatus_availability_idx"
  ON "Property"("status", "rentalMode", "furnishedStatus", "availability");
CREATE INDEX IF NOT EXISTS "Property_title_trgm_idx"
  ON "Property" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Property_description_trgm_idx"
  ON "Property" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Property_city_trgm_idx"
  ON "Property" USING GIN ("city" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Property_area_trgm_idx"
  ON "Property" USING GIN ("area" gin_trgm_ops);