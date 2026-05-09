/*
  Warnings:

  - The `opening_hours` column on the `businesses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `provider_id` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'NOSHOW';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "provider_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
DROP COLUMN "opening_hours",
ADD COLUMN     "opening_hours" JSONB;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "appointments_start_time_idx" ON "appointments"("start_time");

-- CreateIndex
CREATE INDEX "appointments_end_time_idx" ON "appointments"("end_time");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
