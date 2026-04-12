/*
  Warnings:

  - Added the required column `eventTypeId` to the `slots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "slots" ADD COLUMN     "eventTypeId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "slots_eventTypeId_idx" ON "slots"("eventTypeId");

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
