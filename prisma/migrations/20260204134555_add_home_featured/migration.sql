-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "long_description" TEXT,
    "thumbnail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "badge" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "home_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "game_component" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_games" ("badge", "created_at", "featured", "game_component", "id", "long_description", "name", "short_description", "slug", "sort_order", "status", "thumbnail", "updated_at") SELECT "badge", "created_at", "featured", "game_component", "id", "long_description", "name", "short_description", "slug", "sort_order", "status", "thumbnail", "updated_at" FROM "games";
DROP TABLE "games";
ALTER TABLE "new_games" RENAME TO "games";
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
