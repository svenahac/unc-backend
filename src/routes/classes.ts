import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const classRouter = express.Router();

// Route to get all classes
classRouter.get("/", async (req: Request, res: Response) => {
  try {
    const classes = await prisma.annotationClass.findMany();
    res.json(classes);
  } catch (error) {
    console.error("Error getting classes:", error);
    res.status(500).json({ error: "Failed to get classes." });
  }
});

// Route to get all class names
classRouter.get("/names", async (req: Request, res: Response) => {
  try {
    const classes = await prisma.annotationClass.findMany({
      select: {
        name: true,
      },
    });
    res.json(classes);
  } catch (error) {
    console.error("Error getting class names:", error);
    res.status(500).json({ error: "Failed to get class names." });
  }
});

export { classRouter };
