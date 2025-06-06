/*
  Warnings:

  - You are about to drop the column `aiIntervals` on the `Annotation` table. All the data in the column will be lost.
  - You are about to drop the column `intervals` on the `Annotation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Annotation" DROP COLUMN "aiIntervals",
DROP COLUMN "intervals",
ADD COLUMN     "aiAnnotations" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "annotations" JSONB NOT NULL DEFAULT '{}';
