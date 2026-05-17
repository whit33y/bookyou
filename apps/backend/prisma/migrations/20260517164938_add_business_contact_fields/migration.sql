-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "businesses_owner_id_idx" ON "businesses"("owner_id");
