import { Request, Response } from 'express';
import { db } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /units - Get all units
export const getAllUnits = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const units = await db('units', firmId).select();
    res.json(units);
  } catch (error: any) {
    console.error('Error fetching units:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /units - Create a new unit
export const createUnit = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const body = req.body;
    const now = new Date().toISOString();

    const newUnit = {
      id: uuidv4(),
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    await db('units', firmId).insert(newUnit);
    res.status(201).json(newUnit);
  } catch (error: any) {
    console.error('Error creating unit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /units/:id - Get a unit by ID
export const getUnitById = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const unit = await db('units', firmId).where('id', id).first();

    if (!unit) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    res.json(unit);
  } catch (error: any) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /units/:id - Update a unit by ID
export const updateUnit = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;
    const body = req.body;
    const now = new Date().toISOString();

    const existingUnit = await db('units', firmId).where('id', id).first();

    if (!existingUnit) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    const updatedUnit = {
      ...body,
      updatedAt: now,
    };

    await db('units', firmId).where('id', id).update(updatedUnit);

    const unit = await db('units', firmId).where('id', id).first();
    res.json(unit);
  } catch (error: any) {
    console.error('Error updating unit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /units/:id - Delete a unit by ID
export const deleteUnit = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const existingUnit = await db('units', firmId).where('id', id).first();

    if (!existingUnit) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    await db('units', firmId).where('id', id).delete();
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
