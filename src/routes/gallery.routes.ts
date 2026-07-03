import { Router } from 'express';
import pool from '../config/db';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth';   // 👈 import

const router = Router();

// GET public – no auth
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, src, alt FROM gallery ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
  }
});

// POST save image URL – protected
router.post('/', authenticate, async (req, res) => {
  const { src, alt } = req.body;
  if (!src) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO gallery (src, alt) VALUES (?, ?)',
      [src, alt || 'Gallery Image']
    );
    res.status(201).json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to save image' });
  }
});

// DELETE image – protected
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT src FROM gallery WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    const imagePath = path.join(__dirname, '../../', rows[0].src);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

export default router;