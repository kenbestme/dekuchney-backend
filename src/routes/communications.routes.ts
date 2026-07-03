import { Router, Request, Response } from 'express';
import pool from '../config/db';
import nodemailer from 'nodemailer';
import { authenticate } from '../middleware/auth';

const router = Router();

// ---------- Email Templates ----------

// Get all email templates
router.get('/templates', authenticate, async (req: Request, res: Response) => {
  try {
    const [templates] = await pool.query('SELECT * FROM email_templates ORDER BY id');
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/templates/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
});

// Create or update template
router.post('/templates', authenticate, async (req: Request, res: Response) => {
  const { name, subject, body, type } = req.body;
  if (!name || !subject || !body || !type) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO email_templates (name, subject, body, type) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body), type = VALUES(type)',
      [name, subject, body, type]
    );
    res.json({ success: true, message: 'Template saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to save template' });
  }
});

// Delete template
router.delete('/templates/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM email_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
});

// ---------- Send Emails ----------

// Send custom email to a guest
router.post('/send', authenticate, async (req: Request, res: Response) => {
  const { bookingId, subject, message, templateId } = req.body;
  if (!bookingId || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Get guest details
    const [rows]: any = await pool.query('SELECT full_name, email FROM bookings WHERE id = ?', [bookingId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const guest = rows[0];

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: '"De Kuchney Villa" <kuchneyvillahotel@gmail.com>',
      to: guest.email,
      subject: subject,
      html: message
    });

    // Log the email
    await pool.query(
      'INSERT INTO email_logs (booking_id, recipient, subject, message, sent_at) VALUES (?, ?, ?, ?, NOW())',
      [bookingId, guest.email, subject, message]
    );

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

// Send automated emails to all guests with upcoming check-in (pre-arrival)
router.post('/send-pre-arrival', authenticate, async (req: Request, res: Response) => {
  try {
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const dateStr = twoDaysLater.toISOString().split('T')[0];

    const [bookings]: any = await pool.query(
      `SELECT id, full_name, email, suite, check_in, check_out 
       FROM bookings 
       WHERE check_in = ? AND payment_status = 'paid' 
       AND (pre_arrival_sent IS NULL OR pre_arrival_sent = 0)`,
      [dateStr]
    );

    if (bookings.length === 0) {
      return res.json({ success: true, message: 'No pre-arrival emails to send', count: 0 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Get template
    const [templateRows]: any = await pool.query(
      "SELECT * FROM email_templates WHERE type = 'pre_arrival' LIMIT 1"
    );
    const template = templateRows.length > 0 ? templateRows[0] : null;
    let sentCount = 0;

    for (const booking of bookings) {
      let body = template ? template.body : `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; background: #fdfbf7; padding: 40px; border-top: 4px solid #d4af37;">
          <h1 style="text-align: center;">De Kuchney Villa</h1>
          <p>Dear ${booking.full_name},</p>
          <p>We are looking forward to welcoming you in 2 days!</p>
          <p><strong>Suite:</strong> ${booking.suite}<br/>
             <strong>Check-in:</strong> ${booking.check_in}<br/>
             <strong>Check-out:</strong> ${booking.check_out}</p>
          <p>If you have any special requests, please let us know.</p>
          <p>Warm regards,<br/>The Management</p>
        </div>
      `;

      // Replace placeholders
      body = body.replace(/\{full_name\}/g, booking.full_name);
      body = body.replace(/\{suite\}/g, booking.suite);
      body = body.replace(/\{check_in\}/g, booking.check_in);
      body = body.replace(/\{check_out\}/g, booking.check_out);

      await transporter.sendMail({
        from: '"De Kuchney Villa" <kuchneyvillahotel@gmail.com>',
        to: booking.email,
        subject: template ? template.subject : 'Your Stay at De Kuchney Villa is Almost Here!',
        html: body
      });

      // Mark as sent
      await pool.query('UPDATE bookings SET pre_arrival_sent = 1 WHERE id = ?', [booking.id]);
      sentCount++;
    }

    res.json({ success: true, message: `Sent ${sentCount} pre-arrival emails`, count: sentCount });
  } catch (error) {
    console.error('Pre-arrival email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send pre-arrival emails' });
  }
});

// Send post-stay emails (thank you + review request)
router.post('/send-post-stay', authenticate, async (req: Request, res: Response) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const [bookings]: any = await pool.query(
      `SELECT id, full_name, email, suite, check_in, check_out 
       FROM bookings 
       WHERE check_out = ? AND payment_status = 'paid' 
       AND (post_stay_sent IS NULL OR post_stay_sent = 0)`,
      [dateStr]
    );

    if (bookings.length === 0) {
      return res.json({ success: true, message: 'No post-stay emails to send', count: 0 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const [templateRows]: any = await pool.query(
      "SELECT * FROM email_templates WHERE type = 'post_stay' LIMIT 1"
    );
    const template = templateRows.length > 0 ? templateRows[0] : null;
    let sentCount = 0;

    for (const booking of bookings) {
      let body = template ? template.body : `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; background: #fdfbf7; padding: 40px; border-top: 4px solid #d4af37;">
          <h1 style="text-align: center;">De Kuchney Villa</h1>
          <p>Dear ${booking.full_name},</p>
          <p>Thank you for choosing De Kuchney Villa. We hope you had a wonderful stay.</p>
          <p>We would love to hear about your experience. Please take a moment to leave a review.</p>
          <p><a href="https://dekuchneyvilla.com/reviews" style="background: #d4af37; color: black; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Leave a Review</a></p>
          <p>We look forward to welcoming you again!</p>
          <p>Warm regards,<br/>The Management</p>
        </div>
      `;

      body = body.replace(/\{full_name\}/g, booking.full_name);
      body = body.replace(/\{suite\}/g, booking.suite);

      await transporter.sendMail({
        from: '"De Kuchney Villa" <kuchneyvillahotel@gmail.com>',
        to: booking.email,
        subject: template ? template.subject : 'Thank You for Staying with Us – Please Leave a Review',
        html: body
      });

      await pool.query('UPDATE bookings SET post_stay_sent = 1 WHERE id = ?', [booking.id]);
      sentCount++;
    }

    res.json({ success: true, message: `Sent ${sentCount} post-stay emails`, count: sentCount });
  } catch (error) {
    console.error('Post-stay email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send post-stay emails' });
  }
});

// Get email logs
router.get('/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const [logs] = await pool.query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100');
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

export default router;