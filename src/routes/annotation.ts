import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./auth";

const prisma = new PrismaClient();
const annotationRouter = express.Router();

// Route to add a new annotation
annotationRouter.post(
  "/",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { audioFileId, annotatedBy, annotations } = req.body;

      // Validate required fields
      if (!audioFileId || !annotatedBy || !annotations) {
        res.status(400).json({
          error:
            "Missing required fields. Please provide audioFileId, annotatedBy, and annotations.",
        });
        return;
      }

      // Validate that the audioFile exists
      const audioFile = await prisma.audioFile.findUnique({
        where: { id: audioFileId },
      });

      if (!audioFile) {
        res.status(404).json({ error: "Audio file not found" });
        return;
      }

      // Validate that the user exists
      const user = await prisma.user.findUnique({
        where: { id: annotatedBy },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Create the annotation
      const newAnnotation = await prisma.annotation.create({
        data: {
          audioFileId,
          annotatedBy,
          annotations,
        },
      });

      // Update the audio file to mark it as annotated
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: {
          annotated: {
            increment: 1,
          },
        },
      });

      res.status(201).json(newAnnotation);
    } catch (error) {
      console.error("Error creating annotation:", error);
      res.status(500).json({ error: "Failed to create annotation." });
    }
  }
);

// Route to get all annotations where audioFile.annotated is true
annotationRouter.get("/all", async (req: Request, res: Response) => {
  try {
    const annotations = await prisma.annotation.findMany({
      where: {
        audioFile: {
          annotated: { gt: 0 },
        },
      },
      include: {
        audioFile: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(200).json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    res.status(500).json({ error: "Failed to fetch annotations." });
  }
});

// Route to get all annotations for a specific audio file
annotationRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate that the audioFile exists
    const annotation = await prisma.annotation.findUnique({
      where: { id: id },
    });

    if (!annotation) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }

    res.status(200).json(annotation);
  } catch (error) {
    console.error("Error fetching annotations for audio file:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch annotations for audio file." });
  }
});

annotationRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // We'll take all updatable fields from req.body
  const {
    audioFileId,
    annotatedBy,
    annotations,
    aiAnnotations,
    interfaceVersion,
    labelingTime,
    mousePath,
    hoverDurations,
    aiHoverCount,
    clickDelays,
    labelAgreement,
    intervalAgreement,
    labelAccuracy,
    intervalAccuracy,
  } = req.body;

  try {
    const updatedAnnotation = await prisma.annotation.update({
      where: { id },
      data: {
        // Only update fields if they are provided (avoid overwriting with undefined)
        ...(audioFileId !== undefined && { audioFileId }),
        ...(annotatedBy !== undefined && { annotatedBy }),
        ...(annotations !== undefined && { annotations }),
        ...(aiAnnotations !== undefined && { aiAnnotations }),
        ...(interfaceVersion !== undefined && { interfaceVersion }),
        ...(labelingTime !== undefined && { labelingTime }),
        ...(mousePath !== undefined && { mousePath }),
        ...(hoverDurations !== undefined && { hoverDurations }),
        ...(aiHoverCount !== undefined && { aiHoverCount }),
        ...(clickDelays !== undefined && { clickDelays }),
        ...(labelAgreement !== undefined && { labelAgreement }),
        ...(intervalAgreement !== undefined && { intervalAgreement }),
        ...(labelAccuracy !== undefined && { labelAccuracy }),
        ...(intervalAccuracy !== undefined && { intervalAccuracy }),
      },
    });

    res.status(200).json(updatedAnnotation);
  } catch (error) {
    console.error("Error updating annotation:", error);
    res.status(500).json({ error: "Failed to update annotation." });
  }
});

export { annotationRouter };
