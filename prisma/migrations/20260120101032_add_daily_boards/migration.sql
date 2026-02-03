-- CreateTable
CREATE TABLE "daily_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    "mines" INTEGER NOT NULL,
    "minePositions" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "daily_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "time" INTEGER,
    "moves" INTEGER,
    "used_hints" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "daily_attempts_date_fkey" FOREIGN KEY ("date") REFERENCES "daily_boards" ("date") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_boards_date_key" ON "daily_boards"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_attempts_date_player_id_key" ON "daily_attempts"("date", "player_id");
