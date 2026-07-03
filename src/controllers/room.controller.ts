import { Request, Response } from 'express';
import pool from '../config/db';

// Fetch all rooms
export const getRoomTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rooms] = await pool.query('SELECT * FROM rooms');
    res.status(200).json({ success: true, count: (rooms as any[]).length, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, message: 'Server error fetching rooms' });
  }
};

// Fetch single room by slug
export const getRoomTypeBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const [rooms]: any = await pool.query('SELECT * FROM rooms WHERE slug = ?', [slug]);
    if (rooms.length === 0) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }
    const roomDetails = rooms[0];
    // Optionally fetch amenities if separate table exists, else just return the room
    res.status(200).json({ success: true, data: roomDetails });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching room details' });
  }
};

// Create room
export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, price_per_night, max_guests, beds, wifi, images } = req.body;
    const imagesJson = JSON.stringify(images || []);
    const wifiValue = wifi ? 1 : 0;
    const [result]: any = await pool.query(
      'INSERT INTO rooms (name, slug, description, price_per_night, max_guests, beds, wifi, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson]
    );
    res.status(201).json({ success: true, message: 'Room created', id: result.insertId });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, message: 'Server error creating room' });
  }
};

// Update room
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, price_per_night, max_guests, beds, wifi, images } = req.body;
    const imagesJson = JSON.stringify(images || []);
    const wifiValue = wifi ? 1 : 0;
    await pool.query(
      'UPDATE rooms SET name = ?, slug = ?, description = ?, price_per_night = ?, max_guests = ?, beds = ?, wifi = ?, images = ? WHERE id = ?',
      [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson, id]
    );
    res.status(200).json({ success: true, message: 'Room updated' });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ success: false, message: 'Server error updating room' });
  }
};

// Delete room
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Room deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ success: false, message: 'Server error deleting room' });
  }
};