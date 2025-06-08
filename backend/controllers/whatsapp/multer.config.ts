import multer from "multer";
import fs from "fs";
import path from "path";
import { app } from "electron";
const isElectron = !!process.versions.electron;

// Safe upload directory
const uploadDir = isElectron ? path.join(app.getPath("userData"), "uploads") : path.join(process.cwd(), "uploads");

// Ensure it exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
