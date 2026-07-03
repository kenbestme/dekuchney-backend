"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
// Hardcoded admin credentials (change these!)
const ADMIN_EMAIL = 'admin@dekuchney.com';
const ADMIN_PASSWORD = 'Kenneths247'; // <- change to your secure password
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Generate a JWT token that expires in 7 days
        const token = jsonwebtoken_1.default.sign({ email, role: 'admin' }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '7d' });
        return res.json({ success: true, token });
    }
    else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});
exports.default = router;
