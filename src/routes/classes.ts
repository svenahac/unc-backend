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

// Route to add a new class
classRouter.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "Class name is required." });
    return;
  }

  try {
    const newClass = await prisma.annotationClass.create({
      data: { name },
    });
    res.status(201).json(newClass);
  } catch (error: any) {
    console.error("Error adding new class:", error);

    // Handle unique constraint error gracefully
    if (error.code === "P2002") {
      res.status(409).json({ error: "Class name already exists." });
      return;
    }

    res.status(500).json({ error: "Failed to add new class." });
  }
});

export { classRouter };
