import { Request, Response } from 'express';
import { initializeDatabase, initializFirm } from './../lib/db';

export const initializeHandler = async (req: Request, res: Response):Promise<any> => {
  try {
    await initializFirm();
    res.json({ success: true, message: "Database initialized successfully" });
  } catch (error: any) {
    console.error("Database initialization error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
