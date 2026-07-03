import { Router } from 'express';
import pool from '../config/db';

const router = Router();

// GET /api/settings – fetch all settings
router.get('/', async (req, res) => {
    try {
        // ✅ FIX: cast the query result to any[] to avoid TypeScript error
        const rows = (await pool.query(
            'SELECT whatsapp_number, telegram_username, is_whatsapp_active, is_telegram_active FROM site_settings LIMIT 1'
        )) as any[];

        if (Array.isArray(rows) && rows.length === 0) {
            // Fallback – insert default row
            await pool.query(
                'INSERT INTO site_settings (whatsapp_number, telegram_username, is_whatsapp_active, is_telegram_active) VALUES ("", "", 1, 1)'
            );
            return res.json({
                whatsapp_number: '',
                telegram_username: '',
                is_whatsapp_active: 1,
                is_telegram_active: 1,
            });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('GET /api/settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings – update settings
router.put('/', async (req, res) => {
    const { whatsapp_number, telegram_username, is_whatsapp_active, is_telegram_active } = req.body;

    try {
        await pool.query(
            `UPDATE site_settings 
             SET whatsapp_number = ?, 
                 telegram_username = ?, 
                 is_whatsapp_active = ?, 
                 is_telegram_active = ?`,
            [
                whatsapp_number || '',
                telegram_username || '',
                is_whatsapp_active ? 1 : 0,
                is_telegram_active ? 1 : 0,
            ]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('PUT /api/settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;