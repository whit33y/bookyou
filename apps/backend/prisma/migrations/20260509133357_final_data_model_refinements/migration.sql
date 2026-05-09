/*
  Warnings:

  - You are about to drop the column `address` on the `businesses` table. All the data in the column will be lost.
  - Added the required column `business_id` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `businesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `businesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `businesses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "address",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Poland',
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "zip_code" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "business_staff" (
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "business_staff_pkey" PRIMARY KEY ("business_id","user_id")
);

-- CreateIndex
CREATE INDEX "appointments_business_id_idx" ON "appointments"("business_id");

-- AddForeignKey
ALTER TABLE "business_staff" ADD CONSTRAINT "business_staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_staff" ADD CONSTRAINT "business_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
