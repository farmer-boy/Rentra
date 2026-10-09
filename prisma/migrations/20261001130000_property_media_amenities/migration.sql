CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAmenity_propertyId_amenityId_key"
  ON "PropertyAmenity"("propertyId", "amenityId");
CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAmenity_listingId_amenityId_key"
  ON "PropertyAmenity"("listingId", "amenityId");

INSERT INTO "Amenity" ("id", "name", "createdAt") VALUES
  ('amenity_wifi', 'WiFi', CURRENT_TIMESTAMP),
  ('amenity_parking', 'Parking', CURRENT_TIMESTAMP),
  ('amenity_ac', 'AC', CURRENT_TIMESTAMP),
  ('amenity_heating', 'Heating', CURRENT_TIMESTAMP),
  ('amenity_electricity', 'Electricity', CURRENT_TIMESTAMP),
  ('amenity_gas', 'Gas', CURRENT_TIMESTAMP),
  ('amenity_water', 'Water', CURRENT_TIMESTAMP),
  ('amenity_generator', 'Generator', CURRENT_TIMESTAMP),
  ('amenity_security', 'Security', CURRENT_TIMESTAMP),
  ('amenity_cctv', 'CCTV', CURRENT_TIMESTAMP),
  ('amenity_lift', 'Lift', CURRENT_TIMESTAMP),
  ('amenity_laundry', 'Laundry', CURRENT_TIMESTAMP),
  ('amenity_kitchen', 'Kitchen', CURRENT_TIMESTAMP),
  ('amenity_mess', 'Mess', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;