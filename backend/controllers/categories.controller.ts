import { Request, Response } from 'express';
import { db } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /categories - Fetch all categories
export const getAllCategories = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const categories = await db('categories', firmId).select();
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /categories - Create new category
export const createCategory = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const body = req.body;
    const now = new Date().toISOString();

    const newCategory = {
      id: uuidv4(),
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    await db('categories', firmId).insert(newCategory);
    res.status(201).json(newCategory);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /categories/:id - Fetch category by ID
export const getCategoryById = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const category = await db('categories', firmId).where('id', id).first();

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json(category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /categories/:id - Update category by ID
export const updateCategory = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;
    const body = req.body;
    const now = new Date().toISOString();

    const existingCategory = await db('categories', firmId).where('id', id).first();
    if (!existingCategory) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const updatedCategory = {
      ...body,
      updatedAt: now,
    };

    await db('categories', firmId).where('id', id).update(updatedCategory);

    const category = await db('categories', firmId).where('id', id).first();
    res.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /categories/:id - Delete category by ID
export const deleteCategory = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const existingCategory = await db('categories', firmId).where('id', id).first();
    if (!existingCategory) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    await db('categories', firmId).where('id', id).delete();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
