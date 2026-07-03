"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};
// GET all reviews (public – no token required)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db_1.default.query('SELECT id, name, location, suite, text, rating FROM reviews ORDER BY id DESC');
        res.json({ success: true, data: rows });
    }
    catch (error) {
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
        const [result] = await db_1.default.query('INSERT INTO reviews (name, location, suite, text, rating) VALUES (?, ?, ?, ?, ?)', [name, location, suite, text, rating]);
        res.status(201).json({ success: true, id: result.insertId, message: 'Review added' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});
// PUT update a review (protected)
router.put('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, location, suite, text, rating } = req.body;
    try {
        await db_1.default.query('UPDATE reviews SET name = ?, location = ?, suite = ?, text = ?, rating = ? WHERE id = ?', [name, location, suite, text, rating, id]);
        res.json({ success: true, message: 'Review updated' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});
// DELETE a review (protected)
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.query('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({ success: true, message: 'Review deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});
exports.default = router;
