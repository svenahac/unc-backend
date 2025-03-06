import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "./auth";

const router = express.Router();




export { router as annotatorRouter };
