import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import axios from "axios";

const prisma = new PrismaClient();
const clipRouter = express.Router();
const rootDir = path.join(__dirname, "../../audio");

// Environment variables
const AI_API_URL = process.env.AI_API_URL;

// Predefined array of files for Marko
const markoFiles = [
  "cluster_6_dist0.3609_spl-rpi4-02_2024-07-14T221456_70_97_86_10_16khz.wav",
  "cluster_7_dist1.0947_spl-rpi4-03_2024-12-20T090410_65_92_50_10_16khz.wav",
  "cluster_1_dist0.3534_spl-rpi4-03_2024-11-13T161935_70_78_55_10_16khz.wav",
  "cluster_0_dist0.9115_spl-rpi4-04_2024-09-10T223134_65_68_52_10_16khz.wav",
  "cluster_3_dist1.1305_spl-rpi4-03_2024-09-03T152748_70_97_84_10_16khz.wav",
  "cluster_0_dist0.3199_spl-rpi4-04_2024-08-26T180658_65_65_54_10_16khz.wav",
  "cluster_1_dist0.9195_spl-rpi4-02_2024-07-02T094713_70_100_82_10_16khz.wav",
  "cluster_6_dist1.0492_spl-rpi4-02_2024-07-15T231014_70_98_77_10_16khz.wav",
  "cluster_4_dist1.0592_spl-rpi4-03_2024-12-22T073819_65_85_51_10_16khz.wav",
  "cluster_2_dist0.2506_spl-rpi4-04_2024-09-07T232802_65_73_62_10_16khz.wav",
  "cluster_0_dist1.0759_spl-rpi4-04_2024-08-15T013122_65_83_63_10_16khz.wav",
  "cluster_0_dist0.9412_spl-rpi4-04_2024-08-31T011321_65_66_55_10_16khz.wav",
  "cluster_2_dist0.2511_spl-rpi4-04_2024-09-06T194423_65_66_58_10_16khz.wav",
  "cluster_0_dist0.3214_spl-rpi4-04_2024-08-29T162133_65_67_55_10_16khz.wav",
  "cluster_8_dist0.9093_spl-rpi4-03_2024-08-31T155051_70_76_63_10_16khz.wav",
  "cluster_5_dist0.8968_spl-rpi4-03_2024-08-30T201540_70_72_57_10_16khz.wav",
  "cluster_0_dist0.9201_spl-rpi4-01_2024-08-21T153733_65_83_61_10_16khz.wav",
  "cluster_1_dist0.9529_spl-rpi4-02_2024-07-10T235125_70_103_81_10_16khz.wav",
  "cluster_4_dist1.0761_spl-rpi4-03_2024-11-26T094106_65_70_51_10_16khz.wav",
  "cluster_0_dist1.0503_spl-rpi4-04_2024-08-15T013052_65_85_62_10_16khz.wav",
  "cluster_1_dist0.3522_spl-rpi4-02_2024-07-08T211132_70_81_62_10_16khz.wav",
  "cluster_3_dist0.9333_spl-rpi4-02_2024-06-28T141342_70_94_79_10_16khz.wav",
  "cluster_0_dist0.9309_spl-rpi4-04_2024-09-05T093821_65_90_68_10_16khz.wav",
  "cluster_5_dist0.9068_spl-rpi4-02_2024-07-14T221916_70_90_67_10_16khz.wav",
  "cluster_4_dist1.0948_spl-rpi4-03_2024-12-08T130541_65_91_56_10_16khz.wav",
  "cluster_2_dist0.2561_spl-rpi4-04_2024-09-07T003504_65_81_65_10_16khz.wav",
  "cluster_0_dist0.3230_spl-rpi4-04_2024-08-08T160255_65_68_56_10_16khz.wav"
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
    const { userId } = req.query;

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
          user_id: userId,
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
    const { userId } = req.query;

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
          user_id: userId,
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
