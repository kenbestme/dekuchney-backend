"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
// Helper function to generate JWT – fixed TypeScript overload error on expiresIn
const generateToken = (id, role) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET is not defined');
    // ✅ Properly cast `expiresIn` to satisfy TypeScript v9 strict type checking
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d'),
    };
    return jsonwebtoken_1.default.sign({ id, role }, secret, options);
};
const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;
        const [existingUsers] = await db_1.default.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            res.status(400).json({ success: false, message: 'Email is already registered' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const password_hash = await bcryptjs_1.default.hash(password, salt);
        const [result] = await db_1.default.query(`INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
       VALUES (?, ?, ?, ?, ?, 'customer')`, [first_name, last_name, email, password_hash, phone]);
        const newUserId = result.insertId;
        const token = generateToken(newUserId.toString(), 'customer');
        res.status(201).json({
            success: true,
            token,
            user: { id: newUserId, first_name, last_name, email, role: 'customer' }
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const user = users[0];
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const token = generateToken(user.id.toString(), user.role);
        res.status(200).json({
            success: true,
            token,
            user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};
exports.loginUser = loginUser;
