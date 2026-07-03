import { Request, Response } from 'express';
import pool from '../config/db'; 

export const getGallery = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gallery');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching gallery' });
    }
};

export const addGalleryImage = async (req: Request, res: Response) => {
    try {
        const { src, alt } = req.body;
        await pool.query('INSERT INTO gallery (src, alt) VALUES (?, ?)', [src, alt || 'Gallery Image']);
        res.status(201).json({ success: true, message: 'Image added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add image' });
    }
};

export const deleteGalleryImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
};