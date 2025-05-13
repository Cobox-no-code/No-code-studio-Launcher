import { Request, Response } from 'express';
import { db } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /groups - Fetch all groups
export const getAllGroups = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const groups = await db('groups', firmId).select();
    res.json(groups);
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /groups - Create a new group
export const createGroup = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const body = req.body;
    const now = new Date().toISOString();

    const newGroup = {
      id: uuidv4(),
      firmId,
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    await db('groups', firmId).insert(newGroup);
    res.status(201).json(newGroup);
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /groups/:id - Get group by ID
export const getGroupById = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const group = await db('groups', firmId).where('id', id).first();

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    res.json(group);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /groups/:id - Update group by ID
export const updateGroup = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;
    const updateData = req.body;

    const existingGroup = await db('groups', firmId).where('id', id).first();
    if (!existingGroup) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const now = new Date().toISOString();

    await db('groups', firmId).where('id', id).update({
      ...updateData,
      updatedAt: now,
    });

    const updatedGroup = await db('groups', firmId).where('id', id).first();
    res.json(updatedGroup);
  } catch (error: any) {
    console.error('Error updating group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /groups/:id - Delete group by ID
export const deleteGroup = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const existingGroup = await db('groups', firmId).where('id', id).first();
    if (!existingGroup) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const relatedParties = await db('parties', firmId).where('groupId', id).select();
    if (relatedParties.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete group that is in use. Please reassign parties first.',
      });
    }

    await db('groups', firmId).where('id', id).delete();
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
