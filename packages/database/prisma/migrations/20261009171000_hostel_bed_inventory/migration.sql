CREATE TYPE "HostelBedStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'OCCUPIED',
    'MAINTENANCE'
);

ALTER TABLE "HostelRoom"
ADD COLUMN "roomType" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "genderPolicy" "HostelGenderPolicy",
ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0;

UPDATE "HostelRoom" AS room
SET "price" = COALESCE((
    SELECT listing."rent"
    FROM "Listing" AS listing
    WHERE listing."id" = room."listingId"
), 0);

ALTER TABLE "HostelBed"
ADD COLUMN "status" "HostelBedStatus" NOT NULL DEFAULT 'AVAILABLE';

UPDATE "HostelBed"
SET "status" = CASE
    WHEN "isAvailable" THEN 'AVAILABLE'::"HostelBedStatus"
    ELSE 'OCCUPIED'::"HostelBedStatus"
END;

ALTER TABLE "HostelBed"
DROP COLUMN "isAvailable";

WITH existing AS (
    SELECT
        room."id" AS "hostelRoomId",
        room."capacity",
        room."availableBeds",
        COUNT(bed."id")::INTEGER AS "bedCount",
        COUNT(bed."id") FILTER (WHERE bed."status" = 'AVAILABLE')::INTEGER AS "availableCount"
    FROM "HostelRoom" AS room
    LEFT JOIN "HostelBed" AS bed
        ON bed."hostelRoomId" = room."id"
    GROUP BY room."id"
),
missing AS (
    SELECT
        existing."hostelRoomId",
        slots.number,
        existing."availableBeds",
        existing."availableCount",
        ROW_NUMBER() OVER (
            PARTITION BY existing."hostelRoomId"
            ORDER BY slots.number
        ) AS "missingIndex",
        existing."bedCount"
    FROM existing
    CROSS JOIN LATERAL generate_series(
        existing."bedCount" + 1,
        existing."capacity"
    ) AS slots(number)
)
INSERT INTO "HostelBed" (
    "id",
    "hostelRoomId",
    "bedNumber",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'migration_' || md5(random()::TEXT || clock_timestamp()::TEXT || missing."hostelRoomId" || missing.number::TEXT),
    missing."hostelRoomId",
    missing.number::TEXT,
    CASE
        WHEN missing."availableCount" + missing."missingIndex"
            <= missing."availableBeds"
        THEN 'AVAILABLE'::"HostelBedStatus"
        ELSE 'OCCUPIED'::"HostelBedStatus"
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM missing;

UPDATE "HostelBed" AS bed
SET "status" = 'RESERVED'
WHERE EXISTS (
    SELECT 1
    FROM "Booking" AS booking
    WHERE booking."hostelBedId" = bed."id"
      AND booking."status" IN ('PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED')
      AND booking."endDate" > CURRENT_TIMESTAMP
);

UPDATE "HostelRoom" AS room
SET "availableBeds" = (
    SELECT COUNT(*)::INTEGER
    FROM "HostelBed" AS bed
    WHERE bed."hostelRoomId" = room."id"
      AND bed."status" = 'AVAILABLE'
);

UPDATE "HostelDetails" AS details
SET "availableBeds" = COALESCE((
    SELECT SUM(room."availableBeds")::INTEGER
    FROM "HostelRoom" AS room
    WHERE room."listingId" = details."listingId"
), 0);
