import { Router } from 'express';
import pool from '../config/db';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to verify admin token
const verifyAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// GET all reviews (public – no token required)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, location, suite, text, rating FROM reviews ORDER BY id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// POST create a new review (protected)
router.post('/', verifyAdmin, async (req, res) => {
  const { name, location, suite, text, rating } = req.body;
  if (!name || !location || !suite || !text || !rating) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO reviews (name, location, suite, text, rating) VALUES (?, ?, ?, ?, ?)',
      [name, location, suite, text, rating]
    );
    res.status(201).json({ success: true, id: (result as any).insertId, message: 'Review added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// PUT update a review (protected)
router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, location, suite, text, rating } = req.body;
  try {
    await pool.query(
      'UPDATE reviews SET name = ?, location = ?, suite = ?, text = ?, rating = ? WHERE id = ?',
      [name, location, suite, text, rating, id]
    );
    res.json({ success: true, message: 'Review updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// DELETE a review (protected)
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

export default router;