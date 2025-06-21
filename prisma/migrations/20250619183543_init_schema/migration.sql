-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "accuracy_label" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy_interval" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overreliance_label" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overreliance_interval" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agreement_label" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agreement_interval" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labelTimeAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interfaceSuggestion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioFile" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "annotated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AudioFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "audioFileId" TEXT NOT NULL,
    "annotatedBy" TEXT NOT NULL,
    "annotations" JSONB NOT NULL DEFAULT '{}',
    "aiAnnotations" JSONB NOT NULL DEFAULT '{}',
    "aiClasses" JSONB NOT NULL DEFAULT '{}',
    "interfaceVersion" INTEGER NOT NULL DEFAULT 0,
    "labelingTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mousePath" JSONB NOT NULL DEFAULT '[]',
    "hoverDurations" JSONB NOT NULL DEFAULT '{}',
    "aiHoverCount" INTEGER NOT NULL DEFAULT 0,
    "clickDelays" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "labelAgreement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "intervalAgreement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labelAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "intervalAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnotationClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AnnotationClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AudioFile_filePath_key" ON "AudioFile"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "AnnotationClass_name_key" ON "AnnotationClass"("name");

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_audioFileId_fkey" FOREIGN KEY ("audioFileId") REFERENCES "AudioFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_annotatedBy_fkey" FOREIGN KEY ("annotatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
