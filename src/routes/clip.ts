import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();
const clipRouter = express.Router();
const rootDir = path.join(__dirname, "../../audio");
// Serve a specific audio file by ID
clipRouter.get("/file/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Get the audio file record from the database
    const audioFile = await prisma.audioFile.findUnique({
      where: { id },
    });

    if (!audioFile || !audioFile.filePath) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }

    // Construct the full path to the file
    const filePath = path.join(rootDir, audioFile.filePath);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Audio file not found on server" });
      return;
    }

    // Set appropriate headers for WAV files
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.basename(filePath)}`
    );

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving audio file:", error);
    res.status(500).json({ error: "Failed to serve audio file." });
  }
});

// Get metadata for a random audio file with a URL to access it
clipRouter.get("/random", async (req: Request, res: Response) => {
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

    // Count the total number of matching records
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

    if (!randomAudioFile) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }

    // Construct the file URL (adjust the URL based on your server setup)
    const fileUrl = `/clip/file/${randomAudioFile.id}`;

    // Return metadata with the file URL
    res.status(200).json({
      id: randomAudioFile.id,
      filePath: randomAudioFile.filePath,
      annotated: randomAudioFile.annotated,
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error retrieving random audio file:", error);
    res.status(500).json({ error: "Failed to retrieve random audio file." });
  }
});

// Serve a random audio file directly
clipRouter.get("/random/file", async (req: Request, res: Response) => {
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

    // Count the total number of matching records
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
    });

    if (!randomAudioFile || !randomAudioFile.filePath) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }

    // Construct the full path to the file
    const filePath = path.join(rootDir, randomAudioFile.filePath);
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Audio file not found on server" });
      return;
    }

    // Include metadata in headers
    res.setHeader("X-Audio-Id", randomAudioFile.id);
    res.setHeader("X-Audio-FilePath", path.basename(randomAudioFile.filePath));
    res.setHeader("X-Audio-Annotated", randomAudioFile.annotated.toString());

    // Set appropriate headers for WAV files
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.basename(filePath)}`
    );
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving random audio file:", error);
    res.status(500).json({ error: "Failed to serve random audio file." });
  }
});

export { clipRouter };
