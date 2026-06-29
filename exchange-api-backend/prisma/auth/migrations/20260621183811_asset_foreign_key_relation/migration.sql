/*
  Warnings:

  - You are about to drop the column `asset` on the `Balance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,assetId]` on the table `Balance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assetId` to the `Balance` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Balance_asset_key";

-- DropIndex
DROP INDEX "Balance_userId_asset_key";

-- AlterTable
ALTER TABLE "Balance" DROP COLUMN "asset",
ADD COLUMN     "assetId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_name_key" ON "Asset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_assetId_key" ON "Balance"("userId", "assetId");

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
