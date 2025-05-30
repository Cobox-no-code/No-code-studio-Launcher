import { Request, Response } from "express";
import { db, initializeDatabase } from "./../lib/db";
import { v4 as uuidv4 } from "uuid";
import { FirmDTO } from "../models/firm/firm.mode.";
import axios from "axios";

// GET /firms - List all firms
export const getAllFirms = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "Missing 'phone' query parameter." });
    }

    const firms = await db("firms").where("owner", String(phone)).select(); // ensure it's a string

    res.json(firms);
  } catch (error: any) {
    console.error("Error fetching firms:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /firms - Create a new firm
export const createFirm = async (req: Request, res: Response): Promise<any> => {
  try {
    const body: FirmDTO = req.body;
    const now = new Date().toISOString();
    const existingFirm = await db("firms").where("name", body.name).first();
    if (existingFirm) {
      return res
        .status(400)
        .json({ success: false, error: "Firm name must be unique" });
    }
    const newFirm = {
      id: uuidv4(),
      name: body.name,
      country: body.country || "",
      owner: body.owner || "",
      phone: body.phone || "",
      gstNumber: body.gstNumber || "",
      ownerName: body.ownerName || "",
      businessName: body.businessName || "",
      businessLogo: body.businessLogo || "", // assume base64/binary string
      createdAt: now,
      updatedAt: now,
      address: body.address,
      customFields: JSON.stringify(body.customFields || {}), // 👈 Convert to string
    };

    await db("firms").insert(newFirm);
    await axios.post(`${body.cloudurl}/sync/`, {
      table: "firms",
      records: [newFirm],
      owner: body.owner,
    });
    await initializeDatabase();

    res.status(201).json(newFirm);
  } catch (error: any) {
    console.error("Error creating firm:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /firms/:id - Get a single firm by ID
export const getFirmById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    let firm = await db("firms").where("id", id).first();

    if (!firm) {
      return res.status(404).json({ success: false, error: "Firm not found" });
    }

    firm.customFields = firm.customFields ? JSON.parse(firm.customFields) : {};

    res.json(firm);
  } catch (error: any) {
    console.error("Error fetching firm:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /firms/:id - Update a firm by ID
export const updateFirm = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const now = new Date().toISOString();

    const existingFirm = await db("firms")
      .where("name", body.name)
      .andWhereNot("id", id)
      .first();

    if (existingFirm) {
      return res
        .status(400)
        .json({ success: false, error: "Firm name must be unique" });
    }

    await db("firms")
      .where("id", id)
      .update({
        ...body,
        customFields: JSON.stringify(body.customFields || {}),
        updatedAt: now,
      });

    res.json({ success: true, message: "Firm updated successfully" });
  } catch (error: any) {
    console.error("Error updating firm:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /firms/:id - Delete a firm by ID
export const deleteFirm = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const cloudurl = req.query.cloudurl as string;
    const owner = req.query.owner as string;

    console.log(`➡️ Delete request for firm ID: ${id}`);
    console.log(`🌐 Cloud URL from query: ${cloudurl}`);

    // Fetch firm before deletion
    const firm = await db("firms").where("id", id).first();
    if (!firm) {
      console.warn(`⚠️ Firm not found with ID: ${id}`);
      return res.status(404).json({ success: false, error: "Firm not found" });
    }

    console.log(`✅ Firm found:`, firm);

    // Perform deletion
    await db("firms").where("id", id).delete();
    console.log(`🗑️ Firm deleted: ${id}`);

    // Fetch updated firms list
    const updatedFirms = await db("firms").select();
    console.log(`📦 Updated firms count: ${updatedFirms.length}`);

    // Sync to cloud
    if (cloudurl) {
      try {
        console.log(`🚀 Sending updated firms to cloud...`);
        const response = await axios.post(`${cloudurl}/sync/`, {
          table: "firms",
          records: updatedFirms,
          owner,
        });
        console.log(`✅ Cloud sync successful. Response:`, response.data);
      } catch (syncErr: any) {
        console.error(`❌ Error syncing to cloud:`, syncErr.message || syncErr);
      }
    } else {
      console.warn(`⚠️ Cloud URL not provided. Skipping sync.`);
    }

    res.json({ success: true, message: "Firm deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting firm:", error.message || error);
    res.status(500).json({ success: false, error: error.message });
  }
};
