-- Make CNIC optional at signup and keep one account with tenant-first capabilities.
ALTER TABLE "User" ALTER COLUMN "cnic" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT ARRAY['TENANT'::"Role"];
