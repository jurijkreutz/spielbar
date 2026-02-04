-- CreateTable
CREATE TABLE "daily_sudoku_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "puzzle" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "daily_sudoku_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "time" INTEGER,
    "moves" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "daily_sudoku_attempts_date_fkey" FOREIGN KEY ("date") REFERENCES "daily_sudoku_boards" ("date") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_sudoku_boards_date_key" ON "daily_sudoku_boards"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sudoku_attempts_date_player_id_key" ON "daily_sudoku_attempts"("date", "player_id");
