-- Prepared for review only; this script has not been executed.
-- This repairs the legacy auth schema observed in the local Rentra database.
-- It does not repair or resolve the failed marketplace-foundation migration,
-- and Prisma migrations will remain blocked until that migration chain is fixed.
-- Take a database backup and verify the target database before running.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public."User"') IS NULL
     OR to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'Expected User and _prisma_migrations tables in the public schema';
  END IF;

  IF (
    SELECT count(*)
    FROM public."_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  ) <> 1 OR NOT EXISTS (
    SELECT 1
    FROM public."_prisma_migrations"
    WHERE migration_name = '20261001075450_rentra_marketplace_foundation'
      AND finished_at IS NULL
      AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unexpected Prisma migration state; refusing auth schema repair';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
      AND udt_name = 'Role'
      AND is_nullable = 'NO'
  ) OR EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'roles'
  ) THEN
    RAISE EXCEPTION 'Unexpected User role columns; refusing auth schema repair';
  END IF;

  IF to_regclass('public."RefreshToken"') IS NOT NULL THEN
    RAISE EXCEPTION 'RefreshToken table already exists; refusing auth schema repair';
  END IF;
END
$$;

ALTER TABLE public."User"
  ADD COLUMN "roles" "Role"[];

UPDATE public."User"
SET "roles" = ARRAY["role"];

ALTER TABLE public."User"
  ALTER COLUMN "roles" SET DEFAULT ARRAY['TENANT']::"Role"[],
  ALTER COLUMN "roles" SET NOT NULL;

CREATE TABLE public."RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key"
  ON public."RefreshToken"("tokenHash");

CREATE INDEX "RefreshToken_userId_expiresAt_idx"
  ON public."RefreshToken"("userId", "expiresAt");

COMMIT;
