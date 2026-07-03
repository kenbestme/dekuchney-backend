"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const router = (0, express_1.Router)();
// ========== Shared email sender ==========
async function sendConfirmationEmails(bookingId, reference) {
    try {
        const [rows] = await db_1.default.query('SELECT full_name, email, suite, check_in, check_out FROM bookings WHERE id = ?', [bookingId]);
        if (rows.length === 0)
            return;
        const booking = rows[0];
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        // Admin email
        const adminHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; background: #fdfbf7; padding: 40px; border-top: 4px solid #d4af37;">
        <h1 style="text-align: center;">Payment Confirmed – Booking #${bookingId}</h1>
        <p><strong>Guest:</strong> ${booking.full_name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Suite:</strong> ${booking.suite}</p>
        <p><strong>Check-in:</strong> ${booking.check_in}<br/><strong>Check-out:</strong> ${booking.check_out}</p>
        <p><strong>Transaction ref:</strong> ${reference}</p>
        <hr />
        <p style="font-size: 12px;">Payment has been confirmed. Booking is now active.</p>
      </div>
    `;
        await transporter.sendMail({
            from: '"De Kuchney Villa" <kuchneyvillahotel@gmail.com>',
            to: 'reservations@dekuchneyvilla.com',
            subject: `Payment Confirmed - Booking #${bookingId}`,
            html: adminHtml,
        });
        // Guest email
        const guestHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; background: #fdfbf7; padding: 40px; border-top: 4px solid #d4af37;">
        <h1 style="text-align: center;">De Kuchney Villa</h1>
        <p>Dear ${booking.full_name},</p>
        <p>Your payment has been successfully received. Your booking is now confirmed.</p>
        <p><strong>Suite:</strong> ${booking.suite}<br/>
           <strong>Check-in:</strong> ${booking.check_in}<br/>
           <strong>Check-out:</strong> ${booking.check_out}<br/>
           <strong>Booking ID:</strong> ${bookingId}</p>
        <p>We look forward to welcoming you. If you have any questions, please contact us.</p>
        <p>Warm regards,<br/>The Management</p>
      </div>
    `;
        await transporter.sendMail({
            from: '"De Kuchney Villa" <kuchneyvillahotel@gmail.com>',
            to: booking.email,
            subject: 'Booking Confirmed – De Kuchney Villa',
            html: guestHtml,
        });
        console.log(`📧 Confirmation emails sent for booking ${bookingId}`);
    }
    catch (err) {
        console.error(`❌ Failed to send emails for booking ${bookingId}:`, err);
    }
}
// ========== 1. Initialize Payment ==========
router.post('/initialize', async (req, res) => {
    console.log("\n--- NEW PAYMENT INITIALIZATION ---");
    console.log("Request body:", req.body);
    try {
        const { email, amount, bookingId } = req.body;
        if (!email || !amount || !bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, amount, bookingId'
            });
        }
        const amountInKobo = Math.round(amount * 100);
        console.log(`Initializing payment for ${email}, amount: ₦${amount} (${amountInKobo} kobo)`);
        const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount: amountInKobo,
            reference: `booking_${bookingId}_${Date.now()}`,
            channels: ['card', 'bank_transfer'],
            metadata: { booking_id: bookingId }
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Paystack initialization successful. Redirect URL:", response.data.data.authorization_url);
        res.json({
            success: true,
            authorization_url: response.data.data.authorization_url
        });
    }
    catch (error) {
        console.error("Paystack initialization failed:");
        if (error.response) {
            console.error("Paystack error response:", error.response.data);
            res.status(400).json({
                success: false,
                message: error.response.data.message || 'Payment initialization failed'
            });
        }
        else {
            console.error("Network or server error:", error.message);
            res.status(500).json({
                success: false,
                message: 'Could not connect to Paystack servers'
            });
        }
    }
});
// ========== 2. Verify Transaction (also sends confirmation emails) ==========
router.get('/verify/:reference', async (req, res) => {
    const { reference } = req.params;
    try {
        const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
        const { status, data } = response.data;
        if (status && data.status === 'success') {
            const bookingId = data.metadata?.booking_id;
            if (bookingId) {
                await db_1.default.query('UPDATE bookings SET payment_status = "paid", transaction_ref = ? WHERE id = ?', [reference, bookingId]);
                console.log(`Booking ${bookingId} marked as paid via verification endpoint`);
                // ✅ Send confirmation emails
                await sendConfirmationEmails(bookingId, reference);
            }
            res.json({ success: true, transaction: data });
        }
        else {
            res.json({ success: false, message: 'Payment not successful', transaction: data });
        }
    }
    catch (error) {
        console.error("Verification error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});
// ========== 3. Webhook Endpoint (also sends emails) ==========
router.post('/webhook', async (req, res) => {
    const payloadString = req.body.toString();
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto_1.default
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(payloadString)
        .digest('hex');
    if (signature !== hash) {
        console.error('Invalid Paystack signature – webhook ignored');
        return res.status(401).send('Unauthorized');
    }
    const event = JSON.parse(payloadString);
    if (event.event === 'charge.success') {
        const transactionData = event.data;
        const reference = transactionData.reference;
        const bookingId = transactionData.metadata?.booking_id;
        console.log(`Webhook: Successful payment for booking ${bookingId}, reference ${reference}`);
        try {
            await db_1.default.query('UPDATE bookings SET payment_status = "paid", transaction_ref = ? WHERE id = ?', [reference, bookingId]);
            console.log(`✅ Booking ${bookingId} marked as paid in database`);
            // ✅ Send confirmation emails
            await sendConfirmationEmails(bookingId, reference);
        }
        catch (dbError) {
            console.error(`❌ Failed to update booking ${bookingId}:`, dbError);
        }
    }
    else {
        console.log(`Webhook received non-success event: ${event.event}`);
    }
    res.sendStatus(200);
});
exports.default = router;
