import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { annotationRouter } from "./routes/annotation";
import { audioRouter } from "./routes/audio";
import { clipRouter } from "./routes/clip";
import { classRouter } from "./routes/classes";
import { userRouter } from "./routes/user";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*", // Or specify your frontend URL for security
    exposedHeaders: ["X-Audio-Id", "X-Audio-Filepath", "X-Audio-Annotated"], // Allow frontend to access these headers
  })
);

app.use(express.json());

// Routes with Prefixes
app.use("/auth", authRouter);
app.use("/annotation", annotationRouter);
app.use("/audio", audioRouter);
app.use("/clip", clipRouter);
app.use("/classes", classRouter);
app.use("/users", userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
