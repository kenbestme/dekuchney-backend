"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const router = (0, express_1.Router)();
// GET /api/settings – fetch all settings
router.get('/', async (req, res) => {
    try {
        // ✅ FIX: cast the query result to any[] to avoid TypeScript error
        const rows = (await db_1.default.query('SELECT whatsapp_number, telegram_username, is_whatsapp_active, is_telegram_active FROM site_settings LIMIT 1'));
        if (Array.isArray(rows) && rows.length === 0) {
            // Fallback – insert default row
            await db_1.default.query('INSERT INTO site_settings (whatsapp_number, telegram_username, is_whatsapp_active, is_telegram_active) VALUES ("", "", 1, 1)');
            return res.json({
                whatsapp_number: '',
                telegram_username: '',
                is_whatsapp_active: 1,
                is_telegram_active: 1,
            });
        }
        res.json(rows[0]);
    }
    catch (error) {
        console.error('GET /api/settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
// PUT /api/settings – update settings
router.put('/', async (req, res) => {
    const { whatsapp_number, telegram_username, is_whatsapp_active, is_telegram_active } = req.body;
    try {
        await db_1.default.query(`UPDATE site_settings 
             SET whatsapp_number = ?, 
                 telegram_username = ?, 
                 is_whatsapp_active = ?, 
                 is_telegram_active = ?`, [
            whatsapp_number || '',
            telegram_username || '',
            is_whatsapp_active ? 1 : 0,
            is_telegram_active ? 1 : 0,
        ]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('PUT /api/settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.default = router;
