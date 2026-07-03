"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoom = exports.updateRoom = exports.createRoom = exports.getRoomTypeBySlug = exports.getRoomTypes = void 0;
const db_1 = __importDefault(require("../config/db"));
// Fetch all rooms
const getRoomTypes = async (req, res) => {
    try {
        const [rooms] = await db_1.default.query('SELECT * FROM rooms');
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    }
    catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, message: 'Server error fetching rooms' });
    }
};
exports.getRoomTypes = getRoomTypes;
// Fetch single room by slug
const getRoomTypeBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [rooms] = await db_1.default.query('SELECT * FROM rooms WHERE slug = ?', [slug]);
        if (rooms.length === 0) {
            res.status(404).json({ success: false, message: 'Room not found' });
            return;
        }
        const roomDetails = rooms[0];
        // Optionally fetch amenities if separate table exists, else just return the room
        res.status(200).json({ success: true, data: roomDetails });
    }
    catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).json({ success: false, message: 'Server error fetching room details' });
    }
};
exports.getRoomTypeBySlug = getRoomTypeBySlug;
// Create room
const createRoom = async (req, res) => {
    try {
        const { name, slug, description, price_per_night, max_guests, beds, wifi, images } = req.body;
        const imagesJson = JSON.stringify(images || []);
        const wifiValue = wifi ? 1 : 0;
        const [result] = await db_1.default.query('INSERT INTO rooms (name, slug, description, price_per_night, max_guests, beds, wifi, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson]);
        res.status(201).json({ success: true, message: 'Room created', id: result.insertId });
    }
    catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, message: 'Server error creating room' });
    }
};
exports.createRoom = createRoom;
// Update room
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price_per_night, max_guests, beds, wifi, images } = req.body;
        const imagesJson = JSON.stringify(images || []);
        const wifiValue = wifi ? 1 : 0;
        await db_1.default.query('UPDATE rooms SET name = ?, slug = ?, description = ?, price_per_night = ?, max_guests = ?, beds = ?, wifi = ?, images = ? WHERE id = ?', [name, slug, description, price_per_night, max_guests, beds || 1, wifiValue, imagesJson, id]);
        res.status(200).json({ success: true, message: 'Room updated' });
    }
    catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ success: false, message: 'Server error updating room' });
    }
};
exports.updateRoom = updateRoom;
// Delete room
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query('DELETE FROM rooms WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Room deleted' });
    }
    catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ success: false, message: 'Server error deleting room' });
    }
};
exports.deleteRoom = deleteRoom;
