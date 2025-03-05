import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(express.json());
app.use(authRouter);

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Optional: Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});

export default app;
