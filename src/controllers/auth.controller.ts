import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

// Helper function to generate JWT – fixed TypeScript overload error
const generateToken = (id: string, role: string) => {
  // ✅ Explicitly cast secret to string (TypeScript then knows it's not undefined)
  const secret = process.env.JWT_SECRET as string;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  // ✅ All arguments are now explicitly typed strings
  return jwt.sign({ id, role }, secret, { expiresIn });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    const [existingUsers]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ success: false, message: 'Email is already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result]: any = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
       VALUES (?, ?, ?, ?, ?, 'customer')`,
      [first_name, last_name, email, password_hash, phone]
    );

    const newUserId = result.insertId;
    const token = generateToken(newUserId.toString(), 'customer');

    res.status(201).json({
      success: true,
      token,
      user: { id: newUserId, first_name, last_name, email, role: 'customer' }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const [users]: any = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
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
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};