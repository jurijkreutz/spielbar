-- CreateTable
CREATE TABLE "site_heartbeats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "page" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "site_heartbeats_token_key" ON "site_heartbeats"("token");
