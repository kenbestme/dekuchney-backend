"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth"); // 👈 import
const router = (0, express_1.Router)();
// GET public – no auth
router.get('/', async (req, res) => {
    try {
        const [rows] = await db_1.default.query('SELECT id, src, alt FROM gallery ORDER BY id DESC');
        res.json({ success: true, data: rows });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
    }
});
// POST save image URL – protected
router.post('/', auth_1.authenticate, async (req, res) => {
    const { src, alt } = req.body;
    if (!src) {
        return res.status(400).json({ success: false, message: 'Image URL is required' });
    }
    try {
        const [result] = await db_1.default.query('INSERT INTO gallery (src, alt) VALUES (?, ?)', [src, alt || 'Gallery Image']);
        res.status(201).json({ success: true, id: result.insertId });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to save image' });
    }
});
// DELETE image – protected
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db_1.default.query('SELECT src FROM gallery WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        const imagePath = path_1.default.join(__dirname, '../../', rows[0].src);
        if (fs_1.default.existsSync(imagePath))
            fs_1.default.unlinkSync(imagePath);
        await db_1.default.query('DELETE FROM gallery WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});
exports.default = router;
