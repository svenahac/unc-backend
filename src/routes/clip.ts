import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import axios from "axios";

const prisma = new PrismaClient();
const clipRouter = express.Router();
const rootDir = path.join(__dirname, "../../audio");

// Environment variables
const AI_API_URL = process.env.AI_API_URL || "http://88.200.63.213:8000"; // TODO: remove this

// Predefined array of files for Marko
const markoFiles = [
  "cluster_8_dist0.9200_spl-rpi4-02_2024-07-18T112403_70_89_63_10_16khz.wav",
  "cluster_2_dist0.8836_spl-rpi4-04_2024-08-15T011531_65_67_56_10_16khz.wav",
  "cluster_0_dist0.9326_spl-rpi4-04_2024-08-12T095401_65_75_58_10_16khz.wav",
  "cluster_6_dist0.3656_spl-rpi4-02_2024-07-14T214824_70_97_91_10_16khz.wav",
  "cluster_7_dist0.3169_spl-rpi4-03_2024-10-08T161036_70_74_52_10_16khz.wav",
  "cluster_1_dist0.9020_spl-rpi4-02_2024-07-15T200029_70_82_67_10_16khz.wav",
  "cluster_5_dist0.8874_spl-rpi4-03_2024-08-30T200149_70_74_59_10_16khz.wav",
  "cluster_1_dist0.9026_spl-rpi4-02_2024-06-30T193558_70_90_85_10_16khz.wav",
  "cluster_3_dist0.8983_spl-rpi4-02_2024-07-14T194414_70_89_65_10_16khz.wav",
  "cluster_4_dist1.0786_spl-rpi4-03_2024-12-24T080351_65_93_76_10_16khz.wav",
  "cluster_0_dist0.9368_spl-rpi4-02_2024-07-14T200325_70_78_60_10_16khz.wav",
  "cluster_0_dist0.9405_spl-rpi4-04_2024-09-02T155724_65_88_61_10_16khz.wav",
]

// Keep track of current index for each user
const userIndices = new Map<string, number>();

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
    // Get the userId from query parameters
    const { userId, username } = req.query;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Find files that:
    // 1. Have less than 3 total annotations
    // 2. Haven't been annotated by this user
    const eligibleFiles = await prisma.audioFile.findMany({
      where: {
        annotated: { lt: 3 },
        annotations: {
          none: {
            annotatedBy: userId,
          },
        },
      },
    });

    const count = eligibleFiles.length;

    if (count === 0) {
      res.status(404).json({
        error:
          "No eligible audio files found. You may have already annotated all available files.",
      });
      return;
    }

    // Choose a random file from eligible files
    const randomIndex = Math.floor(Math.random() * count);
    const randomAudioFile = eligibleFiles[randomIndex];

    if (!randomAudioFile || !randomAudioFile.filePath) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }

    // Make GET request to AI service
    let aiResponse = {
      aiClasses: [],
      aiRegions: [],
      interface: 0
    };


    // Remove .wav extension from filePath for AI service
    const recordingId = randomAudioFile.filePath.replace(/\.wav$/i, "");

    try {
      const response = await axios.get(`${AI_API_URL}/get-audio-classes`, {
        params: {
          user_id: username,
          recording_id: recordingId
        }
      });
      if (response.data && typeof response.data === 'object') {
        aiResponse = response.data;
      }
    } catch (error) {
      console.error("Error getting AI predictions:", error);
      // aiResponse remains as the default value
    }

    // Construct the full path to the file
    const filePath = path.join(rootDir, randomAudioFile.filePath);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Audio file not found on server" });
      return;
    }

    // Include metadata in headers
    res.setHeader("X-Audio-Id", randomAudioFile.id.toString());
    res.setHeader("X-Audio-FilePath", path.basename(randomAudioFile.filePath));
    res.setHeader("X-Audio-Annotated", randomAudioFile.annotated.toString());
    res.setHeader("X-AI-Classes", JSON.stringify(aiResponse.aiClasses ?? []));
    res.setHeader("X-AI-Regions", JSON.stringify(aiResponse.aiRegions ?? []));
    res.setHeader("X-AI-Interface", (typeof aiResponse.interface === 'number' ? aiResponse.interface : 0).toString());

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

// Serve audio files from Marko's predefined list
clipRouter.get("/marko", async (req: Request, res: Response) => {
  try {
    // Get the userId from query parameters
    const { userId, username } = req.query;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Get or initialize the current index for this user
    let currentIndex = userIndices.get(userId) || 0;
    let fileFound = false;
    let randomAudioFile = null;

    // Loop through files starting from current index until we find an unannotated file
    while (currentIndex < markoFiles.length && !fileFound) {
      // Find the audio file in the database
      const audioFile = await prisma.audioFile.findFirst({
        where: {
          filePath: markoFiles[currentIndex],
          annotations: {
            none: {
              annotatedBy: userId,
            },
          },
        },
      });

      if (audioFile) {
        randomAudioFile = audioFile;
        fileFound = true;
      } else {
        currentIndex++;
      }
    }

    // Update the user's current index
    userIndices.set(userId, currentIndex);

    if (!randomAudioFile) {
      res.status(404).json({
        error: "No more files available for annotation in the predefined list.",
      });
      return;
    }

    // Remove .wav extension from filePath for AI service
    const recordingId = randomAudioFile.filePath.replace(/\.wav$/i, "");

    let aiResponse = {
      aiClasses: [],
      aiRegions: [],
      interface: 0
    };

    try {
      const response = await axios.get(`${AI_API_URL}/get-audio-classes`, {
        params: {
          user_id: username,
          recording_id: recordingId
        }
      });
      if (response.data && typeof response.data === 'object') {
        aiResponse = response.data;
      }
    } catch (error) {
      console.error("Error getting AI predictions:", error);
      // aiResponse remains as the default value
    }

    // Construct the full path to the file
    const filePath = path.join(rootDir, randomAudioFile.filePath);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Audio file not found on server" });
      return;
    }

    // Include metadata in headers
    res.setHeader("X-Audio-Id", randomAudioFile.id.toString());
    res.setHeader("X-Audio-FilePath", path.basename(randomAudioFile.filePath));
    res.setHeader("X-Audio-Annotated", randomAudioFile.annotated.toString());
    res.setHeader("X-AI-Classes", JSON.stringify(aiResponse.aiClasses ?? []));
    res.setHeader("X-AI-Regions", JSON.stringify(aiResponse.aiRegions ?? []));
    res.setHeader("X-AI-Interface", (typeof aiResponse.interface === 'number' ? aiResponse.interface : 0).toString());

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
    console.error("Error serving Marko's audio file:", error);
    res.status(500).json({ error: "Failed to serve audio file." });
  }
});

export { clipRouter };
