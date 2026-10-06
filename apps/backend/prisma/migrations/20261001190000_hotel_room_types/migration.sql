CREATE TABLE IF NOT EXISTS "RoomType" (
  "id" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "amenities" TEXT[] NOT NULL,
  "numberOfRooms" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "HotelRoom" ADD COLUMN IF NOT EXISTS "roomTypeId" TEXT;
DO $$ BEGIN
  ALTER TABLE "HotelRoom" RENAME COLUMN "roomType" TO "legacyRoomType";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "RoomType_hotelId_name_key"
  ON "RoomType"("hotelId", "name");
CREATE INDEX IF NOT EXISTS "RoomType_hotelId_idx" ON "RoomType"("hotelId");
CREATE INDEX IF NOT EXISTS "HotelRoom_roomTypeId_idx" ON "HotelRoom"("roomTypeId");

DO $$ BEGIN
  ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_hotelId_fkey"
    FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "HotelRoom" ADD CONSTRAINT "HotelRoom_roomTypeId_fkey"
    FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;