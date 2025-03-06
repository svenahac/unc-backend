import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { annotatorRouter } from "./routes/annotator";
import { audioRouter } from "./routes/audio";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes with Prefixes
app.use("/auth", authRouter);
app.use("/annotator", annotatorRouter);
app.use("/audio", audioRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
