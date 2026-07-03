import { Router, Request, Response } from 'express';
import pool from '../config/db';
import axios from 'axios';

const router = Router();

async function getLocationFromIp(ip: string) {
  try {
    if (ip === '::1' || ip === '127.0.0.1') return { city: null, country: null };
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=city,countryCode`);
    if (response.data && response.data.city) {
      return { city: response.data.city, country: response.data.countryCode };
    }
  } catch (err) {
    console.warn('Geolocation failed for IP', ip, err);
  }
  return { city: null, country: null };
}

// GET all bookings
router.get('/', async (req: Request, res: Response) => {
  try {
    const [bookings]: any = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST create booking – NO EMAIL (fast response)
router.post('/', async (req: Request, res: Response) => {
  console.log('📥 POST /api/bookings - body:', req.body);
  const {
    fullName,
    email,
    phone,
    address,
    city,
    state,
    country,
    checkIn,
    checkOut,
    suite,
    requests,
    amount,
    status,
    roomId,
  } = req.body;

  if (!fullName || !email || !checkIn || !checkOut || !suite) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  try {
    if (roomId) {
      const [roomRows]: any = await pool.query('SELECT status FROM rooms WHERE id = ?', [roomId]);
      if (roomRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Room not found' });
      }
      if (roomRows[0].status !== 'available' && roomRows[0].status !== 'reserved') {
        return res.status(400).json({ success: false, message: 'Room is not available' });
      }
      await pool.query('UPDATE rooms SET status = "reserved" WHERE id = ?', [roomId]);
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.connection.remoteAddress;
    const location = await getLocationFromIp(clientIp?.toString() || '');
    const ipCity = location.city;
    const ipCountry = location.country;

    const sql = `
      INSERT INTO bookings 
      (full_name, email, phone, address, city, state, country,
       check_in, check_out, suite, requests, amount, payment_status,
       guest_city, guest_country, guest_ip, room_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      fullName,
      email,
      phone || null,
      address || null,
      city || null,
      state || null,
      country || null,
      checkIn,
      checkOut,
      suite,
      requests || '',
      amount || 0,
      status || 'pending',
      ipCity,
      ipCountry,
      clientIp,
      roomId || null,
      'pending',
    ];

    console.log('Executing SQL:', sql);
    console.log('With values:', values);

    const [result]: any = await pool.query(sql, values);
    const bookingId = result?.insertId;

    if (!bookingId) {
      throw new Error('Insert succeeded but no insertId returned');
    }

    console.log(`✅ Booking created, ID = ${bookingId}`);

    res.status(201).json({
      success: true,
      id: bookingId,
      message: 'Booking saved successfully.',
    });

  } catch (error: any) {
    console.error('❌ Booking creation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Database error',
        sqlMessage: error.sqlMessage || error.message,
        sql: error.sql,
      });
    }
  }
});

// Bulk delete
router.delete('/', async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No IDs provided' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM bookings WHERE id IN (${placeholders})`, ids);
    res.json({ success: true, message: `Deleted ${ids.length} booking(s)` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// Check-in
router.post('/:id/check-in', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roomId } = req.body;

  try {
    const [booking]: any = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (roomId) {
      const [room]: any = await pool.query('SELECT status FROM rooms WHERE id = ?', [roomId]);
      if (room.length === 0) {
        return res.status(400).json({ success: false, message: 'Room not found' });
      }
      if (room[0].status !== 'available' && room[0].status !== 'reserved') {
        return res.status(400).json({ success: false, message: 'Room is not available for check-in' });
      }
      await pool.query('UPDATE bookings SET room_id = ? WHERE id = ?', [roomId, id]);
      await pool.query('UPDATE rooms SET status = "occupied" WHERE id = ?', [roomId]);
    }
    await pool.query('UPDATE bookings SET status = "checked_in" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Guest checked in successfully' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Check-in failed' });
  }
});

// Check-out
router.post('/:id/check-out', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [booking]: any = await pool.query('SELECT room_id FROM bookings WHERE id = ?', [id]);
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const roomId = booking[0].room_id;
    if (roomId) {
      await pool.query('UPDATE rooms SET status = "available" WHERE id = ?', [roomId]);
    }
    await pool.query('UPDATE bookings SET status = "checked_out" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Guest checked out successfully' });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Check-out failed' });
  }
});

// Update payment status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE bookings SET payment_status = ? WHERE id = ?', [status, id]);
    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete single
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.status(200).json({ message: 'Booking deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;