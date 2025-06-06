import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const audioRouter = express.Router();

// Function to get all audio files
const getAllAudioFiles = async () => {
  try {
    const audioFiles = await prisma.audioFile.findMany({
      select: {
        id: true,
        filePath: true,
        annotated: true,
      },
    });
    return audioFiles;
  } catch (error) {
    console.error("Error retrieving audio files:", error);
    throw new Error("Could not retrieve audio files.");
  }
};

// Route to fetch all audio files
audioRouter.get("/", async (req: Request, res: Response) => {
  try {
    const audioFiles = await getAllAudioFiles();
    res.status(200).json(audioFiles); // Return the audio files in response
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve audio files." });
  }
});

// Route to fetch audio files filtered by annotation status
audioRouter.get("/filter", async (req: Request, res: Response) => {
  try {
    const { annotated } = req.query;

    // Convert the query parameter to a boolean
    let isAnnotated: boolean | undefined;

    if (annotated !== undefined) {
      // Handle various string representations of boolean values
      if (annotated === "true" || annotated === "1") {
        isAnnotated = true;
      } else if (annotated === "false" || annotated === "0") {
        isAnnotated = false;
      }
    }

    // Build the query
    const whereClause =
      isAnnotated === true
        ? { annotated: { gt: 0 } }
        : isAnnotated === false
        ? { annotated: 0 }
        : {};

    const audioFiles = await prisma.audioFile.findMany({
      where: whereClause,
      select: {
        id: true,
        filePath: true,
        annotated: true,
      },
    });

    res.status(200).json(audioFiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve filtered audio files." });
  }
});

// Route to fetch a random audio file
audioRouter.get("/random", async (req: Request, res: Response) => {
  try {
    // Optional query parameter to filter by annotation status
    const { annotated } = req.query;

    let whereClause = {};

    // If the annotated parameter exists, filter by it
    if (annotated !== undefined) {
      if (annotated === "true" || annotated === "1") {
        whereClause = { annotated: true };
      } else if (annotated === "false" || annotated === "0") {
        whereClause = { annotated: false };
      }
    }

    // First, count the total number of matching records
    const count = await prisma.audioFile.count({
      where: whereClause,
    });

    if (count === 0) {
      res
        .status(404)
        .json({ error: "No audio files found matching the criteria." });
      return;
    }

    // Generate a random skip value
    const randomSkip = Math.floor(Math.random() * count);

    // Fetch a single random record
    const randomAudioFile = await prisma.audioFile.findFirst({
      where: whereClause,
      skip: randomSkip,
      select: {
        id: true,
        filePath: true,
        annotated: true,
      },
    });

    res.status(200).json(randomAudioFile);
  } catch (error) {
    console.error("Error retrieving random audio file:", error);
    res.status(500).json({ error: "Failed to retrieve a random audio file." });
  }
});

// Route to fetch a single audio file
audioRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const audioFile = await prisma.audioFile.findUnique({
      where: { id },
      include: {
        annotations: true,
      },
    });
    if (!audioFile) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }
    res.status(200).json(audioFile);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve audio file." });
  }
});

// Route to update an audio file
audioRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { annotated } = req.body;
  try {
    const updatedAudioFile = await prisma.audioFile.update({
      where: { id },
      data: { annotated },
    });
    res.status(200).json(updatedAudioFile);
  } catch (error) {
    res.status(500).json({ error: "Failed to update audio file." });
  }
});

// Route to retrieve all annotations for an audio file
audioRouter.get("/:id/annotations", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const annotations = await prisma.annotation.findMany({
      where: { audioFileId: id },
    });
    res.status(200).json(annotations);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve annotations." });
  }
});

export { audioRouter };
