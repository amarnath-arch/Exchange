-- CreateTable
CREATE TABLE "KLine" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "open" TEXT NOT NULL,
    "close" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "quoteVolume" TEXT NOT NULL,
    "trades" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KLine_symbol_start_idx" ON "KLine"("symbol", "start");

-- CreateIndex
CREATE UNIQUE INDEX "KLine_symbol_start_key" ON "KLine"("symbol", "start");
