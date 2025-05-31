import { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";
import { cloud_url } from "../urls.config";

export const attachFirmConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;

    if (!firmId) {
      // No firmId, proceed without attaching firm config
      return next();
    }

    const firm = await db("firms").where("id", firmId).first();

    if (!firm) {
      // Firm not found, proceed silently
      return next();
    }

    // Attach firm config to res.locals
    res.locals.firmId = firmId;
    res.locals.cloudUrl = cloud_url;
    res.locals.owner = firm.owner;
    res.locals.sync_enabled = firm.sync_enabled;

    return next(); // Continue to next middleware or route
  } catch (error) {
    console.error("Error attaching firm config:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
