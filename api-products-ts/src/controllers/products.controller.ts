import { Request, Response } from 'express';
import { pool } from '../conf/dbConnection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Get all active products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE active = TRUE');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'The ID must be a positive integer' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? AND active = TRUE', 
      [id]
    );
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Product not found or inactive' });
      return;
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, stock, description, brand, img } = req.body;

    if (!name || price === undefined || stock === undefined || !description) {
      res.status(400).json({ error: 'Missing required fields (name, price, stock, description)' });
      return;
    }

    if (typeof price !== 'number' || price <= 0 || typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'Price must be greater than zero and stock must be a valid number' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO products (name, price, stock, description, brand, img, active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      [name, price, stock, description, brand || null, img || null]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      price,
      stock,
      description,
      brand: brand || null,
      img: img || null,
      active: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update complete product data
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'The ID must be a positive integer' });
      return;
    }

    const { name, price, stock, description, brand, img } = req.body;

    if (!name || price === undefined || stock === undefined || !description) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (typeof price !== 'number' || price <= 0) {
      res.status(400).json({ error: 'Price must be a number greater than zero' });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? AND active = TRUE', 
      [id]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: 'Product not found or inactive' });
      return;
    }

    await pool.query(
      'UPDATE products SET name = ?, price = ?, stock = ?, description = ?, brand = ?, img = ? WHERE id = ?',
      [name, price, stock, description, brand || null, img || null, id]
    );

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logical deletion (active = FALSE)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'The ID must be a positive integer' });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? AND active = TRUE', 
      [id]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: 'Product not found or already inactive' });
      return;
    }

    await pool.query('UPDATE products SET active = FALSE WHERE id = ?', [id]);
    res.status(200).json({ message: 'Product logically deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Modify exclusively the price
export const changePrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'The ID must be a positive integer' });
      return;
    }

    const { price } = req.body;
    if (typeof price !== 'number' || price <= 0) {
      res.status(400).json({ error: 'Price must be a valid number greater than zero' });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? AND active = TRUE', 
      [id]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: 'Product not found or inactive' });
      return;
    }

    await pool.query('UPDATE products SET price = ? WHERE id = ?', [price, id]);
    res.status(200).json({ message: 'Price updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};