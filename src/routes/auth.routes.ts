import { Router } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Hardcoded admin credentials (change these!)
const ADMIN_EMAIL = 'admin@dekuchney.com';
const ADMIN_PASSWORD = 'Kenneths247'; // <- change to your secure password

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Generate a JWT token that expires in 7 days
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

export default router;