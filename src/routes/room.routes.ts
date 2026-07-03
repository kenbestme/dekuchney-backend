import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET all rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rooms] = await pool.query('SELECT * FROM rooms');
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET single room by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [rooms]: any = await pool.query('SELECT * FROM rooms WHERE slug = ?', [slug]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data: rooms[0] });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create room
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, price_per_night, max_guests, beds, wifi, images, status } = req.body;
    const imagesJson = JSON.stringify(images || []);
    const wifiValue = wifi ? 1 : 0;
    const roomStatus = status || 'available';
    const [result]: any = await pool.query(
      `INSERT INTO rooms (name, slug, description, price_per_night, max_guests, beds, wifi, images, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson, roomStatus]
    );
    res.status(201).json({ success: true, message: 'Room created', id: result.insertId });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH update room (full update)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price_per_night, max_guests, beds, wifi, images, status } = req.body;
    const imagesJson = JSON.stringify(images || []);
    const wifiValue = wifi ? 1 : 0;
    await pool.query(
      `UPDATE rooms SET name = ?, slug = ?, description = ?, price_per_night = ?, max_guests = ?, beds = ?, wifi = ?, images = ?, status = ? WHERE id = ?`,
      [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson, status || 'available', id]
    );
    res.json({ success: true, message: 'Room updated' });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ PATCH /api/rooms/:id/status – Update room status (used by reception dashboard)
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    await pool.query('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Room status updated' });
  } catch (error) {
    console.error('Error updating room status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE room
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;