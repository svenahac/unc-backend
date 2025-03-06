/*
  Warnings:

  - You are about to drop the column `endTime` on the `Annotation` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Annotation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `AudioFile` table. All the data in the column will be lost.
  - You are about to drop the `_AnnotationToAnnotationClass` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `annotatedBy` to the `Annotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `annotations` to the `Annotation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AudioFile" DROP CONSTRAINT "AudioFile_userId_fkey";

-- DropForeignKey
ALTER TABLE "_AnnotationToAnnotationClass" DROP CONSTRAINT "_AnnotationToAnnotationClass_A_fkey";

-- DropForeignKey
ALTER TABLE "_AnnotationToAnnotationClass" DROP CONSTRAINT "_AnnotationToAnnotationClass_B_fkey";

-- AlterTable
ALTER TABLE "Annotation" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "annotatedBy" TEXT NOT NULL,
ADD COLUMN     "annotations" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "AudioFile" DROP COLUMN "userId";

-- DropTable
DROP TABLE "_AnnotationToAnnotationClass";

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_annotatedBy_fkey" FOREIGN KEY ("annotatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
