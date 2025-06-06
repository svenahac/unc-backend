/*
  Warnings:

  - You are about to drop the column `aiAnnotations` on the `Annotation` table. All the data in the column will be lost.
  - You are about to drop the column `annotations` on the `Annotation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Annotation" DROP COLUMN "aiAnnotations",
DROP COLUMN "annotations",
ADD COLUMN     "aiIntervals" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "intervals" JSONB NOT NULL DEFAULT '{}';
