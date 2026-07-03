"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const router = (0, express_1.Router)();
// GET all rooms
router.get('/', async (req, res) => {
    try {
        const [rooms] = await db_1.default.query('SELECT * FROM rooms');
        res.status(200).json({ success: true, data: rooms });
    }
    catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET single room by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const [rooms] = await db_1.default.query('SELECT * FROM rooms WHERE slug = ?', [slug]);
        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.status(200).json({ success: true, data: rooms[0] });
    }
    catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST create room
router.post('/', async (req, res) => {
    try {
        const { name, slug, description, price_per_night, max_guests, beds, wifi, images, status } = req.body;
        const imagesJson = JSON.stringify(images || []);
        const wifiValue = wifi ? 1 : 0;
        const roomStatus = status || 'available';
        const [result] = await db_1.default.query(`INSERT INTO rooms (name, slug, description, price_per_night, max_guests, beds, wifi, images, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson, roomStatus]);
        res.status(201).json({ success: true, message: 'Room created', id: result.insertId });
    }
    catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PATCH update room (full update)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price_per_night, max_guests, beds, wifi, images, status } = req.body;
        const imagesJson = JSON.stringify(images || []);
        const wifiValue = wifi ? 1 : 0;
        await db_1.default.query(`UPDATE rooms SET name = ?, slug = ?, description = ?, price_per_night = ?, max_guests = ?, beds = ?, wifi = ?, images = ?, status = ? WHERE id = ?`, [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson, status || 'available', id]);
        res.json({ success: true, message: 'Room updated' });
    }
    catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ✅ PATCH /api/rooms/:id/status – Update room status (used by reception dashboard)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    try {
        await db_1.default.query('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Room status updated' });
    }
    catch (error) {
        console.error('Error updating room status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE room
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query('DELETE FROM rooms WHERE id = ?', [id]);
        res.json({ success: true, message: 'Room deleted' });
    }
    catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
