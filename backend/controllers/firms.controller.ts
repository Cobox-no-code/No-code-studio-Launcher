import { Request, Response } from 'express';
import { db, initializeDatabase } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { FirmDTO } from '../models/firm/firm.mode.';

// GET /firms - List all firms
export const getAllFirms = async (_req: Request, res: Response) => {
  try {
    const firms = await db('firms').select();
    res.json(firms);
  } catch (error: any) {
    console.error('Error fetching firms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /firms - Create a new firm
export const createFirm = async (req: Request, res: Response): Promise<any> => {
  try {
    const body: FirmDTO = req.body;
    const now = new Date().toISOString();

    const newFirm = {
      id: uuidv4(),
      name: body.name,
      country: body.country || '',
      phone: body.phone || '',
      gstNumber: body.gstNumber || '',
      ownerName: body.ownerName || '',
      businessName: body.businessName || '',
      businessLogo: body.businessLogo || '', // assume base64/binary string
      createdAt: now,
      updatedAt: now,
    };

    await db('firms').insert(newFirm);
    await initializeDatabase();

    res.status(201).json(newFirm);
  } catch (error: any) {
    console.error('Error creating firm:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// GET /firms/:id - Get a single firm by ID
export const getFirmById = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const firm = await db('firms').where('id', id).first();

    if (!firm) {
      return res.status(404).json({ success: false, error: 'Firm not found' });
    }

    res.json(firm);
  } catch (error: any) {
    console.error('Error fetching firm:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /firms/:id - Update a firm by ID
export const updateFirm = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const now = new Date().toISOString();

    await db('firms').where('id', id).update({
      ...body,
      updatedAt: now,
    });

    res.json({ success: true, message: 'Firm updated successfully' });
  } catch (error: any) {
    console.error('Error updating firm:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /firms/:id - Delete a firm by ID
export const deleteFirm = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const deleted = await db('firms').where('id', id).delete();

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Firm not found' });
    }

    res.json({ success: true, message: 'Firm deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting firm:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
