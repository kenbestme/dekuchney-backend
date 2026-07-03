"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGalleryImage = exports.addGalleryImage = exports.getGallery = void 0;
const db_1 = __importDefault(require("../config/db"));
const getGallery = async (req, res) => {
    try {
        const [rows] = await db_1.default.query('SELECT * FROM gallery');
        res.status(200).json({ success: true, data: rows });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching gallery' });
    }
};
exports.getGallery = getGallery;
const addGalleryImage = async (req, res) => {
    try {
        const { src, alt } = req.body;
        await db_1.default.query('INSERT INTO gallery (src, alt) VALUES (?, ?)', [src, alt || 'Gallery Image']);
        res.status(201).json({ success: true, message: 'Image added' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add image' });
    }
};
exports.addGalleryImage = addGalleryImage;
const deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query('DELETE FROM gallery WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Image deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
};
exports.deleteGalleryImage = deleteGalleryImage;
