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

export { audioRouter };
