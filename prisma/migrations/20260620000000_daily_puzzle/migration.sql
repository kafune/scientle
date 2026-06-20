-- CreateTable
CREATE TABLE "DailyPuzzle" (
    "dayKey" TEXT NOT NULL,
    "puzzleNumber" INTEGER NOT NULL,
    "scientistName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPuzzle_pkey" PRIMARY KEY ("dayKey")
);
