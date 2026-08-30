-- Bağış, başvuru ve kurban kayıtları arttıkça filtre/sıralama (status, createdAt)
-- sorguları tam tablo taramasına düşmesin diye eklendi.
CREATE INDEX "Donation_status_idx" ON "Donation"("status");
CREATE INDEX "Donation_createdAt_idx" ON "Donation"("createdAt");

CREATE INDEX "AidApplication_status_idx" ON "AidApplication"("status");
CREATE INDEX "AidApplication_createdAt_idx" ON "AidApplication"("createdAt");

CREATE INDEX "SacrificeOrder_status_idx" ON "SacrificeOrder"("status");
CREATE INDEX "SacrificeOrder_createdAt_idx" ON "SacrificeOrder"("createdAt");

CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");
