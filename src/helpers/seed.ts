import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const audioDir = path.join(__dirname, "../../audio");

//Command to run it npx ts-node .\seed.ts

async function seed() {
  try {
    // Step 1: Ensure the uploads/audio directory exists
    if (!fs.existsSync(audioDir)) {
      console.log("No audio directory found. Creating...");
      fs.mkdirSync(audioDir, { recursive: true });
      return;
    }

    // Step 2: Create admin user
    console.log("Creating admin user...");
    // For a real application, you should use a strong hashing algorithm
    // Here's a simple example using bcrypt
    const hashedPassword = await bcrypt.hash("admin", 10);

    await prisma.user.upsert({
      where: { username: "admin" },
      update: {}, // No updates if it exists
      create: {
        username: "admin",
        password: hashedPassword, // Store hashed password, not plaintext
      },
    });
    console.log("Admin user created or already exists.");

    // Step 4: Read files in the audio directory (filter only .wav files)
    const audioFiles = fs
      .readdirSync(audioDir)
      .filter((file) => file.endsWith(".wav"));

    if (audioFiles.length === 0) {
      console.log("No .wav audio files found in uploads/audio.");
      return;
    }

    console.log(
      `Found ${audioFiles.length} .wav audio files. Seeding database..`
    );

    // Step 5: Seed audio files
    for (const file of audioFiles) {
      const existingFile = await prisma.audioFile.findUnique({
        where: { filePath: file },
      });
      if (!existingFile) {
        await prisma.audioFile.create({
          data: {
            filePath: file,
          },
        });
        console.log(`Added: ${file}`);
      } else {
        console.log(`Skipped (already exists): ${file}`);
      }
    }
    console.log("Audio files seeded successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
