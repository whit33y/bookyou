-- CreateIndex
CREATE UNIQUE INDEX "businesses_owner_id_active_key" ON "businesses"("owner_id") WHERE "deleted_at" IS NULL;
