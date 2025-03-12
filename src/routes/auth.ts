import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../prisma"; // Use centralized Prisma client

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Middleware to verify JWT token
const authMiddleware = (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" + token });
  }
};

// User Registration Route
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      userId: newUser.id,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User Login Route
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res
      .status(200)
      .json({ message: "Login successful", userId: user.id, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected Route
router.get("/protected", authMiddleware, (req: Request, res: Response) => {
  res.json({ message: "You have access" });
});

export { router as authRouter, authMiddleware };
