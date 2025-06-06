import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const userRouter = express.Router();

// Route to get all classes
userRouter.get("/", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        annotations: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

userRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        annotations: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "Audio file not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve audio file." });
  }
});

userRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    accuracy,
    overreliance,
    agreement,
    labelTimeAvg,
    engagementScore,
    interfaceSuggestion,
  } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        accuracy,
        overreliance,
        agreement,
        labelTimeAvg,
        engagementScore,
        interfaceSuggestion,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user." });
  }
});

export { userRouter };
